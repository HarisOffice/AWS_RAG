from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json
import random
import math
# Load environment variables
load_dotenv()
DATABASE_URI = os.getenv("DATABASE_URI")

# Initialize MongoDB client
client = MongoClient(DATABASE_URI)
db = client["Board"]
paper_mcq = db["PaperMCQs"]
papers = db["PaperQuestions"]

def get_questions(grade,course,type, quantity, chapter):
    query = {
        "grade": grade,
        "course": course,
        "Question_Type": type,
        "Chapter": chapter
    }

    projection = {
        "Questions": 1,
        "_id": 0
    }

    results = papers.find(query, projection).limit(quantity)
    questions_data = []

    for result in results:
        questions_data.append({
            "question": result["Questions"]
        })

    # Return the JSON formatted string and count as a tuple
    return json.dumps(questions_data, indent=4), len(questions_data)

def getQuestions(grade,course,type, quantity, chapters, years):
    questionPerChapter = math.ceil(quantity/len(chapters))
    
    questions_data = []
    for chapter in chapters:
        query = {
            "grade": grade,
            "course": course,
            "Question_Type": type,
            "Chapter": chapter,
            "Year": {"$in": years}
        }
        projection = {
            "Questions": 1,
            "Year" : 1,
            "Chapter" : 1,
            "_id": 0
        }
        results = papers.find(query, projection).limit(questionPerChapter)
        for result in results:
            questions_data.append({
                "question": result["Questions"],
                "reference" : f"Year : {result['Year']},Chapter : {result['Chapter']}"
            })
    questions_data = questions_data[:quantity]
    random.shuffle(questions_data)
    return json.dumps(questions_data, indent=4), len(questions_data)

def paper_mcqs(grade,course,quantity, years):
    paperMcq_Data = []
    questioPerYear = math.ceil(quantity/len(years))
    for year in years:
        query = {
            "grade":grade,
            "course": course,
            "Year": year,  
        }
        projection = {
            "Question": 1,
            "Options": 1,
            "Year" : 1,
            "_id": 0
        }
        
        results = paper_mcq.find(query, projection).limit(questioPerYear)
        
        for result in results:
            paperMcq_Data.append(
                {
                    "question": result["Question"],
                    "options": result["Options"],
                    "reference" : result["Year"]
                } 
            )
    paperMcq_Data = paperMcq_Data[:quantity]
    random.shuffle(paperMcq_Data)
    return json.dumps(paperMcq_Data, indent=4), len(paperMcq_Data)