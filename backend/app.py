from fastapi import FastAPI, HTTPException,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from pymongo import MongoClient
from passlib.context import CryptContext
import openai
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
import pandas as pd
import utils
from datetime import datetime
import pytz
import os
from dotenv import load_dotenv
import uvicorn
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from async_timeout import timeout
from starlette.middleware.base import BaseHTTPMiddleware
import threading
import random
# Load environment variables
import paperdb
import contentdb
import bookdb
import historydb
from patterns import patterns

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY2")
GROQ_API_KEY1 = os.getenv("GROQ_API_KEY3")
DATABASE_URI = os.getenv("DATABASE_URI")    

# Initialize FastAPI app
app = FastAPI()

origins = [
    "http://localhost:5173",  
    "https://ai.myedbox.com/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Explicitly specify the frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

client = MongoClient(DATABASE_URI)
db = client["Board"]  # For storing users, history, and API data
books = db['Books']

# class TimeoutMiddleware(BaseHTTPMiddleware):
#     async def dispatch(self, request: Request, call_next):
#         try:
#             # Set a timeout of 60 seconds
#             with timeout(60):
#                 response = await call_next(request)
#                 return response
#         except TimeoutError:
#             # Handle timeout
#             return JSONResponse(
#                 {"detail": "Request timed out. Please try again."}, status_code=408
#             )

# app.add_middleware(TimeoutMiddleware)

llm = ChatGroq(
    temperature=1,  # Lower temperature for deterministic responses
    # model="llama3-8b-8192",
    model="llama-3.3-70b-versatile",
    # model="llama-3.1-8b-instant",
    api_key=GROQ_API_KEY,
    max_tokens=2048,  # Increase max token limit to accommodate longer responses
)
llm1 = ChatGroq(
    temperature=1,  # Lower temperature for deterministic responses
    # model="llama3-8b-8192",
    model="llama-3.3-70b-versatile",
    # model="llama-3.1-8b-instant",
    api_key=GROQ_API_KEY1,
    max_tokens=2048,  # Increase max token limit to accommodate longer responses
)

def get_embedding(text, model="text-embedding-ada-002"):
    text = text.replace("\n", " ")  # Clean up text
    response = openai.embeddings.create(
        model=model,
        input=text
    )
    # Access the embedding correctly from the response object
    embedding = response.data[0].embedding  # Using attribute access
    return embedding

def get_local_time():
    local_tz = pytz.timezone("Asia/Karachi")
    local_time = datetime.now(local_tz)
    return local_time.strftime("%Y-%m-%d %H:%M:%S")

# Utility function to get the client's IP address
def get_client_ip(request: Request):
    return request.client.host

# Function to hash the password
def hash_password(password: str):
    return pwd_context.hash(password)

# Function to verify the password
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# MongoDB Retriever
class MongoRetriever:
    def __init__(self, collection):
        self.collection = collection

    def sim_search(self, query,book_name, top_k=3):
        # Get embedding for the query
        query_embedding = get_embedding(query)
        
        mongo_query = {}
        if book_name:
            mongo_query['name'] = book_name

        # Retrieve relevant documents from MongoDB
        documents = list(self.collection.find(mongo_query))
        
        # Calculate cosine similarity between the query embedding and document embeddings
        similarities = []
        for doc in documents:
            doc_embedding = np.array(doc['embedding'])
            similarity = cosine_similarity([query_embedding], [doc_embedding])
            similarities.append((doc, similarity[0][0]))
        
        # Sort documents by similarity score
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top_k most similar documents
        return [doc[0] for doc in similarities[:top_k]]


# Instantiate MongoRetriever
retriever = MongoRetriever(books)

# Set up the RAG prompt
rag_template_str = """
You are a teacher agent designed to make quizzes over a set of books and past papers provided to you.
Please always use the tools provided to answer questions. Do not rely on prior knowledge.

context: {context}

query: {query}
"""
rag_prompt = ChatPromptTemplate.from_template(rag_template_str)
rag_chain = rag_prompt | llm | StrOutputParser()
rag_chain1 = rag_prompt | llm1 | StrOutputParser()

# Function to run the RAG chain
def get_rag_answer(query,book_name=None):
    # Retrieve relevant documents from MongoDB
    context = retriever.sim_search(query,book_name=book_name)
    
    # Format context to be passed into the RAG prompt
    context_text = "\n".join([doc['text'] for doc in context])
    # Run RAG chain
    response = rag_chain.invoke({"query": query, "context": context_text})
    return response

def get_rag_answer1(query,book_name=None):
    # Retrieve relevant documents from MongoDB
    context = retriever.sim_search(query,book_name=book_name)
    
    # Format context to be passed into the RAG prompt
    context_text = "\n".join([doc['text'] for doc in context])
    
    # Run RAG chain
    response = rag_chain1.invoke({"query": query, "context": context_text})
    return response


# FastAPI Models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Models
class UserAdd(BaseModel):
    email: str
    password: str
    name: str 
    
class User(BaseModel):
    email: str
    password: str

class ApiData(BaseModel):
    formData: dict
    apiResponse: list
    timestamp: str
    userEmail:str
    apiResponseTime:str
    error:str
    
class QueryRequestQ(BaseModel):
    grade: int
    course: str
    quantity: int
    chapter: str
    type: str
    difficulty: str

class QueryRequestP(BaseModel):
    grade: int
    course: str
    difficulty: str
    quantityNumericals: int
    
class QueryReqPaper(BaseModel):
    grade: int
    course: str
    type : str
    quantity : int
    chapter : list[str]
    years : list[int]
    
class QueryRequestC(BaseModel):
    grade: int
    course: str

class QueryRequestT(BaseModel):
    grade: int
    course: str
    chapter: List[str]

class QueryRequest(BaseModel):
    grade: int
    course: str
    quantity: int
    difficulty: str
    topic: str
    
class QueryRequestMCQDb(BaseModel):
    grade: int
    course: str
    quantity:int
    chapter:List[str]

class QueryRequestEndQuestion(BaseModel):
    grade: int
    course: str
    quantity:int
    section:str
    chapter:list[str]
    questionType:int

class QueryRequestPaperMcqs(BaseModel):
    grade: int
    course: str
    quantity: int
    years: List[int]

class QueryRequestPaper(BaseModel):
    grade: int
    course: str
    quantity: int
    difficulty: str
    topic: List[str]
    
class QueryRequestAnswerKey(BaseModel):
    grade: int
    course: str
    question: str

class QueryResponse(BaseModel):
    query: str
    response: str
    
class QueryResponseID(BaseModel):
    query: str
    response: int

@app.get("/api/")
def read_root():
    return {"message": "Welcome!"}

@app.get("/api/index")
def read_root():
    return {"message": "Welcome to the API"}

def handle_signup(user: UserAdd, result_holder: dict):
    try:
        # Check if user already exists
        existing_user = db.Users.find_one({"email": user.email})
        if existing_user:
            result_holder["error"] = "User already exists"
            return

        # Hash password before saving
        hashed_password = hash_password(user.password)

        # Save the new user to the "Users" collection
        db.Users.insert_one({
            "name": user.name,
            "email": user.email,
            "password": hashed_password
        })

        # Populate result holder with success message
        result_holder["message"] = "User created successfully"
    except Exception as e:
        result_holder["error"] = str(e)
        
def handle_signin(user: User, request: Request, result_holder: dict):
    try:
        # Find the user by email
        db_user = db.Users.find_one({"email": user.email})
        if not db_user:
            result_holder["error"] = "Invalid email or password"
            return

        # Verify the password (hash the input and compare with stored hash)
        if not verify_password(user.password, db_user["password"]):
            result_holder["error"] = "Invalid email or password"
            return

        # Get the client's IP address
        client_ip = get_client_ip(request)

        # Store the login history with the IP address in the "History" collection
        login_history = {
            "email": user.email,
            "time": get_local_time(),
            "ip": client_ip,
        }
        db.History.insert_one(login_history)

        # Populate the result holder with successful login info
        result_holder["message"] = "Login successful"
        result_holder["ip"] = client_ip
        result_holder["name"] = db_user.get("name")  # Fetch the name field from the database user
    except Exception as e:
        result_holder["error"] = str(e)
        
def handle_store_api_data(stored_data: dict, result_holder: dict):
    try:
        # Insert the received data into the MongoDB "ApiData" collection
        db.ApiData.insert_one({
            "formData": stored_data["formData"],
            "apiResponse": stored_data["apiResponse"],
            "timestamp": stored_data["timestamp"],
            "userEmail": stored_data["userEmail"],
            "apiResponseTime": stored_data["apiResponseTime"],
            "error": stored_data["error"],
            "generateID": stored_data["generateID"],
            "type": stored_data["type"],
            "method": stored_data["method"]
        })
        result_holder["message"] = "API data stored successfully"
    except Exception as e:
        result_holder["error"] = str(e)
        
def generate_mcqs(query: str, result_holder: dict,request: Request):
    try:
        book_name = f"{request.course.lower()}_{request.grade}.pdf"
        response = get_rag_answer(query,book_name)  # Your existing function for RAG answer
        parse_data = utils.mcqs(response)  # Assuming this is for parsing the result
        result_holder["data"] = parse_data
    except Exception as e:
        result_holder["error"] = str(e)
        
def generate_fill_in_the_blanks(query: str, result_holder: dict,request: Request):
    try:
        book_name = f"{request.course.lower()}_{request.grade}.pdf"
        response = get_rag_answer(query,book_name)  # Your existing function for RAG answer
        parse_data = utils.blanks(response)  # Assuming this is for parsing the result
        result_holder["data"] = parse_data
    except Exception as e:
        result_holder["error"] = str(e)
        
def generate_questions(query: str, result_holder: dict,request: Request):
    try:
        book_name = f"{request.course.lower()}_{request.grade}.pdf"
        response = get_rag_answer(query,book_name)
        parse_data = utils.questions(response)
        result_holder["data"] = parse_data
    except Exception as e:
        result_holder["error"] = str(e)
        
def generate_answerkey(query: str,request:QueryRequestAnswerKey, result_holder: dict):
    try:
        parse_data = contentdb.get_api_response_key(request.question)
        if(parse_data == ""):
            book_name = f"{request.course.lower()}_{request.grade}.pdf"
            response = get_rag_answer1(query,book_name)
            parse_data = utils.answerkey(response)
        result_holder["data"] = parse_data
    except Exception as e:
        result_holder["error"] = str(e)
        
def get_paper_questions(request: QueryRequestQ, result_holder: dict):
    try:
        response, _ = paperdb.get_questions(request.grade,request.course,request.type, request.quantity, request.chapter.upper())
        result_holder["data"] = response
    except Exception as e:
        result_holder["error"] = str(e)
        
def getPaperData(request : QueryReqPaper, resultHolder : dict):
    try:
        response , _ = paperdb.getQuestions(request.grade,request.course,request.type,request.quantity,request.chapter,request.years)
        resultHolder["data"] = response
    except Exception as e:
        resultHolder["error"] = str(e)
        
def get_book_mcqs(request: QueryRequestMCQDb, result_holder: dict):
    try:
        response, _ = bookdb.MCQS(request.grade,request.course,request.quantity, request.chapter)
        result_holder["data"] = response
    except Exception as e:
        result_holder["error"] = str(e)
        
def get_book_questions(request: QueryRequestEndQuestion, result_holder: dict):
    try:
        response, _ = bookdb.fetch_unit_questions(request.grade,request.course,request.quantity,request.section, request.chapter, request.questionType)
        result_holder["data"] = response
    except Exception as e:
        result_holder["error"] = str(e)

def get_paper_mcqs(request: QueryRequestPaperMcqs, resultHolder: dict):
    try:
        response, _ = paperdb.paper_mcqs(request.grade,request.course,request.quantity, request.years)  
        resultHolder["data"] = response
    except Exception as e:
        resultHolder["error"] = str(e)

def get_chapters(request: QueryRequestC,result_holder: dict):
    try:
        response, _ = contentdb.get_chapters(request.grade, request.course)
        result_holder["data"] = response
    except Exception as e:
        result_holder["error"] = str(e)
        
def get_generateID(result_holder: dict):
    try:
        response = contentdb.get_latest_generateID()
        result_holder["data"] = response
    except Exception as e:
        result_holder["error"] = str(e)
        
def get_topics(request: QueryRequestT,result_holder: dict):
    try:
        response, _ = contentdb.get_topics_for_chapters(request.grade,request.course,request.chapter)
        result_holder["data"] = response
    except Exception as e:
        result_holder["error"] = str(e)


# API endpoint for signing up
@app.post("/api/signup")
async def signup(user: UserAdd):
    result_holder = {}

    # Start the sign-up process in a background thread
    thread = threading.Thread(target=handle_signup, args=(user, result_holder))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle the result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=400, detail=result_holder["error"])

    return {"message": result_holder["message"]}



# API endpoint for signing in
@app.post("/api/signin")
async def signin(user: User, request: Request):
    result_holder = {}

    # Start the sign-in process in a background thread
    thread = threading.Thread(target=handle_signin, args=(user, request, result_holder))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle the result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=401, detail=result_holder["error"])

    return {
        "message": result_holder["message"],
        "ip": result_holder["ip"],
        "name": result_holder["name"]
    }




# API endpoint for storing API data
@app.post("/api/store_api_data")
async def store_api_data(stored_data: dict):
    result_holder = {}

    # Start the task to store API data in a background thread
    thread = threading.Thread(target=handle_store_api_data, args=(stored_data, result_holder))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle the result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=result_holder["error"])

    return {"message": result_holder["message"]}


# API Endpoint for MCQ Generation


# API endpoint for generating MCQs using threading
@app.post("/api/mcqs", response_model=QueryResponse)
async def mcqs_book(request: QueryRequest):
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} multiple-choice questions (MCQs) of {request.difficulty} level on the topic '{request.topic}'. The questions should meet the following criteria:

    1. Each question must have 4 options, with one correct answer.
    2. The questions must be clear, concise, and aligned with the topic content from the provided book and past papers.
    3. The questions should be suitable for a Class {request.grade} understanding level.
    4. Each question should follow the format:
       '5. [Question Text]'
       A) [Option A]
       B) [Option B]
       C) [Option C]
       D) [Option D]
       Correct Answer: [Correct Option Text]
    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """
    
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_mcqs, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query=query, response=result_holder["data"])

# API endpoint for generating Fill in the Blanks questions using threading
@app.post("/api/blanks", response_model=QueryResponse)
async def blanks_book(request: QueryRequest):
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} Fill in the blanks of {request.difficulty} level on the topic '{request.topic}'. The questions should meet the following criteria:

    1. Each question must have a blank, with one correct answer.
    2. The questions must be clear, concise, and aligned with the topic content from the provided book and past papers.
    3. The questions should be suitable for a Class {request.grade} understanding level.
    4. Each question should follow the format:
       '5. [Question Text]'
       Correct Answer: [Correct Text]
    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """
    
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_fill_in_the_blanks, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query=query, response=result_holder["data"])

# API endpoint for retrieving numerical paper questions using threading
@app.post("/api/paper", response_model=QueryResponse)
async def paper_db(request: QueryRequestQ):
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=get_paper_questions, args=(request, result_holder))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query='', response=result_holder["data"])

@app.post("/api/generateID", response_model=QueryResponseID)
async def generateID_db():
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=get_generateID, args=(result_holder,))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")
    
    return QueryResponseID(query='', response=result_holder["data"])

@app.post("/api/chapters", response_model=QueryResponse)
async def chapters_db(request: QueryRequestC):
    result_holder = {}
    # Start the task in a separate thread
    thread = threading.Thread(target=get_chapters, args=(request,result_holder,))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")
    
    return QueryResponse(query='', response=result_holder["data"])

@app.post("/api/topics", response_model=QueryResponse)
async def topics_db(request: QueryRequestT):
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=get_topics, args=(request,result_holder,))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")
    
    return QueryResponse(query='', response=result_holder["data"])



# API endpoint for generating long questions using threading
@app.post("/api/long", response_model=QueryResponse)
async def long_book(request: QueryRequestQ):
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} {request.difficulty} level long questions related to the chapter '{request.chapter}' from the book. The questions should meet the following criteria:

    1. The questions must be clear, concise, and aligned with the topic content from the provided book.
    2. The questions should be suitable for a Class {request.grade} understanding level.
    3. Each question should follow one of these patterns:
       '1. What is kinematics? Derive the equation \(2aS = v_f^2 - v_i^2\).'
       '2. Define equilibrium. Explain its types and two conditions.'
       '3. State and explain Boyle's Law. Write its one application.' 
       '4. Define Thermal expansion. Derive \(\Delta L = lpha L \Delta T\).'
       '5. Describe the construction and working of hydraulic machine with the help of diagram.'
       
    4. Each question should follow the format:
       '5. [Question Text]'
    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    
    If you donot find the information from the book then donot answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """

    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_questions, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")
    
    return QueryResponse(query=query, response=result_holder["data"])

# API endpoint for generating short questions using threading
@app.post("/api/short", response_model=QueryResponse)
async def short_book(request: QueryRequestQ):
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} short questions related to the chapter '{request.chapter}' from the book. The questions should meet the following criteria:
    1. The questions must be clear, concise, and aligned with the topic content from the provided book.
    2. The questions should be suitable for a Class {request.grade} understanding level.
    3. Each question should follow one of these patterns:
       '1. Define fundamental and derived quantities. Also write three examples of each.'
       '2. State Newton’s Second Law of Motion and derive its equation.'
       '3. Write down three differences between Boiling Point and Evaporation.'
       '4. What is potential energy? Derive P.E = mgh.'
       '5. What do you mean by elasticity? State Hooke’s Law and write its mathematical expression.'
    4. Each question should follow the format:
       '5. [Question Text]'
    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """

    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_questions, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query=query, response=result_holder["data"])
    
@app.post("/api/numerical", response_model=QueryResponse)
async def numerical_book(request: QueryRequestQ):
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} numerical questions related to the chapter '{request.chapter}' from the book. The questions should meet the following criteria:

    1. The questions must be clear, concise, and aligned with the topic content from the provided book.
    2. The questions should be suitable for a Class {request.grade} understanding level.
    3. Each question should follow one of these patterns:
       '1. If the weight of Amna is 200N at the surface of the earth, find the mass of Amna.'
       '2. A bus is moving on a road with 15 m/s and accelerates at 5 m/s². Find the final velocity of the bus after 6 seconds.'
       '3. A cylinder contains 60 cm³ of air at a pressure of 140 kPa. What will its volume be if the pressure on it is increased to 200 kPa?' 
       '4. A ball is dropped from the top of the height of 70m. How much time, the ball will take to strike the ground? (g = 10ms^-2)'
       '5. A mechanic uses a double arm spanner to turn a nut. He applies a force of 15N at each end of the spanner and produces a torque of 60Nm. What is the length of the moment arm of the couple?'
       
    4. Each question should follow the format:
       '5. [Question Text]'
    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """

    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_questions, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")
    
    return QueryResponse(query=query, response=result_holder["data"])

@app.post("/api/paperA", response_model=QueryResponse)
async def paper_a(request: QueryRequestP):
    query = f"""
   Using the provided {request.grade} {request.course} book, generate a total of 12 multiple-choice questions (MCQs) of {request.difficulty} level from these chapters, considering their weight for generation out of 100:
    [
    "Physical Quantities And Measurement": 11.90,
    "Kinematics": 11.90,
    "Dynamics": 11.90,
    "Turning Effect Of Forces": 11.90,
    "Forces And Matter": 10.19,
    "Gravitation": 08.22,
    "Properties Of Matter": 10.19,
    "Energy Sources And Transfer Of Energy": 11.90,
    "Thermal Properties Of Matter": 11.90
    ]
    The questions should meet the following criteria:
    1. Each question must have 4 options, with one correct answer.
    2. The questions must be clear, concise, and aligned with the topic content from the provided book and past papers.
    3. The questions should be suitable for a Class {request.grade} understanding level.
    4. Each question should follow the format:
    '5. [Question Text]'
    A) [Option A]
    B) [Option B]
    C) [Option C]
    D) [Option D]
    Correct Answer: [Correct Option Text]
    
    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    
    If you do not find the information from the book, do not answer. Please ensure the output matches this structure exactly. Do not include extra text or information.
    """

    result_holder = {}

    # Start the background task to generate MCQs
    thread = threading.Thread(target=generate_mcqs, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=result_holder["error"])

    return QueryResponse(query=query, response=result_holder["data"])

@app.post("/api/paperB", response_model=QueryResponse)
async def paper_b(request: QueryRequestP):
    query = f""" 
       Using the provided {request.grade} {request.course} book, generate a total of 10 short questions of {request.difficulty} level from these chapters, considering their weight for generation out of 100:
    [
    "Physical Quantities And Measurement": 13.16,
    "Kinematics": 13.16,
    "Dynamics": 13.16,
    "Turning Effect Of Forces": 13.16,
    "Forces And Matter": 10.53,
    "Gravitation": 8.89,
    "Properties Of Matter": 6.26,
    "Energy Sources And Transfer Of Energy": 8.52,
    "Thermal Properties Of Matter": 13.16
    ]
    Out of 10 questions to be generated, {request.quantityNumericals} of them should be numericals.
    The questions should meet the following criteria:
    1. The questions must be clear, concise, and aligned with the topic content from the provided book.
    2. The questions should be suitable for a Class {request.grade} understanding level.
    3. Each question should follow one of these patterns:
       '1. Define fundamental and derived quantities. Also write three examples of each.'
       '2. State Newton’s Second Law of Motion and derive its equation.'
       '3. Write down three differences between Boiling Point and Evaporation.' 
       '4. What is potential energy? Derive P.E = mgh.'
       '5. What do you mean by elasticity? State Hooke’s Law and write its mathematical expression.'
       
    4. Each question should follow the format:
       '5. [Question Text]'

    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """

    result_holder = {}

    # Start the background task to generate short questions
    thread = threading.Thread(target=generate_questions, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=result_holder["error"])

    return QueryResponse(query=query, response=result_holder["data"])

@app.post("/api/paperC", response_model=QueryResponse)
async def paper_c(request: QueryRequestP):
    query = f""" 
       Using the provided {request.grade} {request.course} book, generate a total of 6 long questions of {request.difficulty} level from these chapters, considering their weight for generation out of 100:
    [
    "Physical Quantities And Measurement": 0,
    "Kinematics": 19.05,
    "Dynamics": 4.76,
    "Turning Effect Of Forces": 9.52,
    "Forces And Matter": 9.52,
    "Gravitation": 4.76,
    "Properties Of Matter": 14.29,
    "Energy Sources And Transfer Of Energy": 19.05,
    "Thermal Properties Of Matter": 19.05
    ]
    The questions should meet the following criteria:
    1. The questions must be clear, concise, and aligned with the topic content from the provided book.
    2. The questions should be suitable for a Class {request.grade} understanding level.
    3. Each question should follow one of these patterns:
       '1. What is kinematics? Derive the equation \(2aS = v_f^2 - v_i^2\).'
       '2. Define equilibrium. Explain its types and two conditions.'
       '3. State and explain Boyle's Law. Write its one application.' 
       '4. Define Thermal expansion. Derive \(\Delta L = \alpha L \Delta T\).'
       '5. Describe the construction and working of hydraulic machine with the help of diagram.'
       
    4. Each question should follow the format:
       '5. [Question Text]'

    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    
    If you do not find the information from the book, do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """

    result_holder = {}

    # Start the background task to generate long questions
    thread = threading.Thread(target=generate_questions, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=result_holder["error"])

    return QueryResponse(query=query, response=result_holder["data"])

@app.post("/api/objective/mcqs", response_model=QueryResponse)
async def mcqs_book(request: QueryRequestPaper):
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} multiple-choice questions (MCQs) of {request.difficulty} level on the following topics: {request.topic}. The questions should meet the following criteria:

    1. Each question must have 4 options, with one correct answer.
    2. The questions must be clear, concise, and aligned with the topic content from the provided book and past papers.
    3. The questions should be suitable for a Class {request.grade} understanding level.
    4. Provide reference of chapter and topic with each MCQ and also ensure it matches with provided topics. Donot display it is not from book.
    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    6. Each question should follow the format:
       '5. [Question Text]'
       A) [Option A]
       B) [Option B]
       C) [Option C]
       D) [Option D]
       Correct Answer: [Correct Option Text]
    Reference: [Reference Text]
    
    Treat each topic as a distinct and independent entity, ensuring that the questions align strictly with the specific content of each topic. Donot mention anything in question text about reference.
    Also provide reference of chapter and topic at the end of each MCQ.
    Consider all topics of equal weightage depending upon the quantity provided.
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """
    
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_mcqs, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query=query, response=result_holder["data"])


@app.post("/api/objective/blanks", response_model=QueryResponse)
async def blanks_book(request: QueryRequestPaper):
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} Fill in the blanks of {request.difficulty} level on the following topics: {request.topic}. The questions should meet the following criteria:

    1. Each question must have a blank, with one correct answer.
    2. The questions must be clear, concise, and aligned with the topic content from the provided book and past papers.
    3. The questions should be suitable for a Class {request.grade} understanding level.
    4. Provide reference of chapter and topic with each Blank and also ensure it matches with provided topics. Donot display it is not from book.
    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    6. Each question should follow the format:
       '5. [Question Text]'
       Correct Answer: [Correct Text]
    Reference: [Reference Text]
    Treat each topic as a distinct and independent entity, ensuring that the questions align strictly with the specific content of each topic. Donot mention anything in question text about reference.
    Also provide reference of chapter and topic at the end of each Blank.
    Consider all topics of equal weightage depending upon the quantity provided.
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """
    
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_fill_in_the_blanks, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query=query, response=result_holder["data"])


@app.post("/api/short/descriptive", response_model=QueryResponse)
async def short_book(request: QueryRequestPaper):
    course_patterns = patterns.get(request.course.lower(), {}).get("short")
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} short questions of {request.difficulty} level on the following topics: {request.topic}. The questions should meet the following criteria:

    1. The questions must be clear, concise, and aligned with the topic content from the provided book and past papers.
    2. The questions should be suitable for a Class {request.grade} understanding level.
    3. Provide reference of chapter and topic with each Short Question and also ensure it matches with provided topics. Donot display it is not from book or reference not found.
    4. Each question should follow one of these patterns:
        {chr(10).join([f"'{p}'" for p in course_patterns])}
    5. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    6. Each question should follow the format but not exactly same with same values:
       '5. [Question Text]'
    Reference: [Reference Text]
    Treat each topic as a distinct and independent entity, ensuring that the questions align strictly with the specific content of each topic. Donot mention anything in question text about reference.
    Also provide reference of chapter and topic at the end of each question.
    Consider all topics of equal weightage depending upon the quantity provided.
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """
    
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_questions, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query=query, response=result_holder["data"])




@app.post("/api/short/numerical", response_model=QueryResponse)
async def numerical_book(request: QueryRequestPaper):
    course_patterns = patterns.get(request.course.lower(), {}).get("numerical")
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} numerical questions of {request.difficulty} level on the following topics: {request.topic}. The questions should meet the following criteria:
    1. Each question must have a correct answer.
    2. The questions must be clear, concise, and aligned with the topic content from the provided book and past papers.
    3. The questions should be suitable for a Class {request.grade} understanding level.
    4. Provide reference of chapter and topic with each Numerical Question and also ensure it matches with provided topics. Donot display it is not from book or reference not found.
    5. Each question should follow one of these patterns:
        {chr(10).join([f"'{p}'" for p in course_patterns])}
    6. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    7. Each question should follow the format:
       '5. [Question Text]'
        Correct Answer: [Correct Text]
    Reference: [Reference Text]
    Treat each topic as a distinct and independent entity, ensuring that the questions align strictly with the specific content of each topic. Donot mention anything in question text about reference.
    Also provide reference of chapter and topic at the end of each question.
    Consider all topics of equal weightage depending upon the quantity provided.
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """
    
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_questions, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query=query, response=result_holder["data"])

@app.post("/api/long/descriptive", response_model=QueryResponse)
async def numerical_book(request: QueryRequestPaper):
    course_patterns = patterns.get(request.course.lower(), {}).get("long")
    query = f"""
    Using the provided {request.grade} {request.course} book, generate a total of {request.quantity} long descriptive questions of {request.difficulty} level on the following topics: {request.topic}. The questions should meet the following criteria:
    1. Each question must have a correct answer.
    2. The questions must be clear, concise, and aligned with the topic content from the provided book and past papers.
    3. The questions should be suitable for a Class {request.grade} understanding level.
    4. Provide reference of chapter and topic with each Numerical Question and also ensure it matches with provided topics. Donot display it is not from book or reference not found.
    5. Each question should follow the format but not exactly same with same values:
        {chr(10).join([f"'{p}'" for p in course_patterns])}
       '5. Describe the construction and working of hydraulic machine with the help of diagram.'
    6. Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²).
    7. Each question should follow the format:
       '5. [Question Text]'
        Correct Answer: [Correct Text]
    Reference: [Reference Text]
    Treat each topic as a distinct and independent entity, ensuring that the questions align strictly with the specific content of each topic. Donot mention anything in question text about reference.
    Also provide reference of chapter and topic at the end of each question.
    Consider all topics of equal weightage depending upon the quantity provided.
    If you do not find the information from the book then do not answer!
    Please ensure the output matches this structure exactly. Do not include extra text or information.
    """
    
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_questions, args=(query, result_holder,request))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query=query, response=result_holder["data"])  

@app.post("/api/answer", response_model=QueryResponse)
async def numerical_answer(request: QueryRequestAnswerKey):
    query = f"""
    Solve the following Question and provide me a complete answer with proper units and answer key with units as well. 
    1. Each Answer should follow the format:
    Solution: 
        [Complete Solution]  
    Answer Key: 
        [Answer] 
    Question: {request.question} 
    Answer Key should be a single answer.
    Do not include raw equations in formats like "9.81 m/s^2". Instead, please ensure that equations are properly formatted (e.g., gravitational acceleration: 9.81 m/s²). 
    Final Answer of the solution and Answer Key must match and should be correct. 
    Donot provide complete solution just provide answer of it. 
    Take reference from the book
    """
    result_holder = {}

    # Start the task in a separate thread
    thread = threading.Thread(target=generate_answerkey, args=(query,request, result_holder))
    thread.start()
    thread.join()  # Wait for the thread to finish

    # Handle result or error from the background thread
    if "error" in result_holder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

    return QueryResponse(query=query, response=result_holder["data"])

@app.post("/api/book/mcqs" , response_model = QueryResponse)
async def bookMCQDb(request:QueryRequestMCQDb):
    resultHolder = {}
    
    thread = threading.Thread(target=get_book_mcqs , args= (request,resultHolder))
    thread.start()
    thread.join()
    
    if "error" in resultHolder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {resultHolder['error']}")
    return QueryResponse(query='', response=resultHolder["data"])

#api for Questions Of Chapters, from Book
@app.post("/api/book/questions" , response_model = QueryResponse)
async def endUnitQ(request:QueryRequestEndQuestion):
    resultHolder = {}
    
    thread = threading.Thread(target=get_book_questions , args= (request,resultHolder))
    thread.start()
    thread.join()
    
    if "error" in resultHolder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {resultHolder['error']}")
    return QueryResponse(query='', response=resultHolder["data"])
#api for paper MCQS
@app.post("/api/paper/paperMcq",response_model=QueryResponse)
async def paperMCQ(request : QueryRequestPaperMcqs):
    resultHolder = {}
    thread = threading.Thread(target = get_paper_mcqs , args = (request,resultHolder))
    thread.start()
    thread.join()
    
    if "error" in resultHolder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {resultHolder['error']}")
    return QueryResponse(query='', response=resultHolder["data"])

@app.post("/api/getPaper", response_model=QueryResponse)
async def paperDb(request: QueryReqPaper):
    resultHolder = {}
    thread = threading.Thread(target=getPaperData, args=(request, resultHolder))
    thread.start()
    thread.join()
    if "error" in resultHolder:
        raise HTTPException(status_code=500, detail=f"Error generating response: {resultHolder['error']}")
    return QueryResponse(query='', response=resultHolder["data"])

@app.get("/api/history")
def fetch_questions(
    userEmail:str = None,
    course: str = None,
    grade: str = None,
    difficulty: str = None,
    method: str = None,
    page: int = 1,
    per_page: int = 5
):
    data = historydb.get_questions(userEmail,course, grade, difficulty, method, page, per_page)
    return {
        "page": page,
        "per_page": per_page,
        "total": data["total"],
        "questions": data["results"]
    }

# @app.post("/api/answer/question", response_model=QueryResponse)
# async def question_answer(request: QueryRequestAnswerKey):
#     query = f"""
#     Solve the following Question and provide me a complete answer of 1 to 3 lines.
#     1. Each Answer should follow the format:
#     Answer Key: 
#        [Answer Key Value]
    
#     Question: {request.question}
#     Answer Key should be a single answer.
#     Donot provide complete solution just provide answer of it.
#     Take reference from the book.
#     Please ensure the output matches this structure exactly. Do not include extra text or information.
#     """
    
#     result_holder = {}

#     # Start the task in a separate thread
#     thread = threading.Thread(target=generate_answerkey, args=(query, result_holder))
#     thread.start()
#     thread.join()  # Wait for the thread to finish

#     # Handle result or error from the background thread
#     if "error" in result_holder:
#         raise HTTPException(status_code=500, detail=f"Error generating response: {result_holder['error']}")

#     return QueryResponse(query=query, response=result_holder["data"])

# Run the app with Uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app:app",           
        host="0.0.0.0",       
        port=8000,            
        timeout_keep_alive=300,  
        # reload=True
        workers=4      
    )

                
