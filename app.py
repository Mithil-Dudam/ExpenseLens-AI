import os
import shutil
import json
from typing import Annotated
import bcrypt
from datetime import datetime, timezone

import easyocr
from dotenv import load_dotenv

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from fastapi import FastAPI, status, UploadFile, File, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware


from sqlalchemy import create_engine, DateTime, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import Session, declarative_base
from pydantic import BaseModel

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

URL_db = os.getenv("URL_db")
engine = create_engine(URL_db)
sessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)


class Expenses(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, index=True)
    amount = Column(Float)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class LoginInfo(BaseModel):
    email: str
    password: str


Base.metadata.create_all(bind=engine)


def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()


db_dependency = Annotated[Session, Depends(get_db)]


llm = ChatOllama(model="llama3.2", temperature=0)
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
            You are an expert at reading OCR results from receipts.
            Your task is to extract the final total amount paid and the purchase category.
            - For the total, select the line that clearly indicates the final amount due, typically labeled 'TOTAL', 'AMOUNT DUE', or similar.
            - Ignore lines mentioning 'cash', 'change', 'amount tendered', 'balance', 'subtotal', 'tax', or any intermediate values.
            - Do not select values from lines like 'CASH', 'CHANGE', 'AMOUNT TENDERED', 'BALANCE', 'SUBTOTAL', or 'TAX'.
            - For the category, choose one from: Groceries, Dining, Gas, Pharmacy, Shopping, Entertainment, Utilities, Other.
            Respond ONLY with a single-line, minified JSON object in the following format:
            {{"total_amount": <float or "Total amount not found">, "category": <category string or "Category not found">}}
            - total_amount must be a float (e.g., 12.34) or the string "Total amount not found".
            - category must be exactly one of: Groceries, Dining, Gas, Pharmacy, Shopping, Entertainment, Utilities, Other, or "Category not found".
            - If multiple totals/categories are found, choose the most likely final total and category.
            - Do not include any explanation, formatting, extra text, or newlines.
            Example valid output:
            {{"total_amount": 23.50, "category": "Groceries"}}
            """,
        ),
        (
            "user",
            "Extract the total amount and category from the following OCR results:\n{ocr_results}",
        ),
    ]
)
chain = prompt | llm

reader = easyocr.Reader(["en"], gpu=False)


@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: LoginInfo, db: db_dependency):
    user_exists = db.query(Users).filter(Users.email == user.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_pw = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt())
    user = Users(email=user.email, password=hashed_pw.decode("utf-8"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User registered successfully"}


@app.post("/login", status_code=status.HTTP_200_OK)
async def login(user: LoginInfo, db: db_dependency):
    user_exists = db.query(Users).filter(Users.email == user.email).first()
    if not user_exists:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if not bcrypt.checkpw(
        user.password.encode("utf-8"), user_exists.password.encode("utf-8")
    ):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    return {"message": "Login successful", "user_id": user_exists.id}


@app.get("/all-expenses/{user_id}", status_code=status.HTTP_200_OK)
async def get_all_expenses(
    user_id: int,
    db: db_dependency,
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
):
    query = (
        db.query(Expenses)
        .filter(Expenses.user_id == user_id)
        .order_by(Expenses.created_at.desc())
    )
    total = query.count()
    grand_total = (
        db.query(func.sum(Expenses.amount)).filter(Expenses.user_id == user_id).scalar()
        or 0
    )
    expenses = query.offset(offset).limit(limit).all()
    return {"expenses": expenses, "total": total, "grand_total": grand_total}


@app.get("/expenses-by-category/{user_id}", status_code=status.HTTP_200_OK)
async def get_expenses_by_category(
    user_id: int,
    category: str,
    db: db_dependency,
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
):
    query = (
        db.query(Expenses)
        .filter(Expenses.user_id == user_id, Expenses.category == category)
        .order_by(Expenses.created_at.desc())
    )
    total = query.count()
    grand_total = (
        db.query(func.sum(Expenses.amount))
        .filter(Expenses.user_id == user_id, Expenses.category == category)
        .scalar()
        or 0
    )
    expenses = query.offset(offset).limit(limit).all()
    return {"expenses": expenses, "total": total, "grand_total": grand_total}


@app.post("/receipt", status_code=status.HTTP_200_OK)
async def upload_receipt(file: UploadFile = File(...)):
    os.makedirs("uploads", exist_ok=True)
    for filename in os.listdir("uploads"):
        file_path = os.path.join("uploads", filename)
        os.remove(file_path)

    file_path = os.path.join("uploads", file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"message": "Receipt uploaded successfully"}


@app.post("/process-receipt/{user_id}", status_code=status.HTTP_200_OK)
async def process_receipt(user_id: int, db: db_dependency):
    for filename in os.listdir("uploads"):
        file_path = os.path.join("uploads", filename)
        results = reader.readtext(file_path)
        ocr_text = "\n".join([i[1] for i in results])
        response = chain.invoke({"ocr_results": ocr_text})
        print(response)
        parsed = json.loads(response.content)
        expense = Expenses(
            category=parsed.get("category", "Category not found"),
            amount=float(parsed.get("total_amount", 0))
            if (
                isinstance(parsed.get("total_amount"), (int, float, str))
                and str(parsed.get("total_amount")).replace(".", "", 1).isdigit()
                and parsed.get("total_amount") != "Total amount not found"
            )
            else 0,
            user_id=user_id,
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return parsed
