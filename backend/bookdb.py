from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json
import math
import random

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URI")

client = MongoClient(DATABASE_URL)
db = client["Board"]
mcqs = db["BookMCQs"]
endUnitQuestion = db["BookQuestions"]
#mcqs function to fetch mcqs data from book
def MCQS(grade,course,quantity,chapters):
    mcqs_data = []
    questionPerChapter = math.ceil(quantity/len(chapters))
    for chapter in chapters:   
        query ={
            "grade":grade,
            "course":course,
            "Chapter" : chapter,
        }
        projection = {
            "Question" : 1,
            "Options" : 1,
            "Chapter" : 1,
            "_id" : 0
        }
        results = mcqs.find(query,projection).limit(questionPerChapter)
        
        
        for result in results:
            mcqs_data.append(
                {
                    "question" : result['Question'],
                    "options" : result['Options'],
                    "reference" : result["Chapter"]
                }
            )
    mcqs_data = mcqs_data[:quantity]
    random.shuffle(mcqs_data)
    return json.dumps(mcqs_data, indent=4), len(mcqs_data)
#question function to fetch descriptive questions data from book
def fetch_unit_questions(grade,course,quantity,section, chapter, questionType):
    questionPerTopic = math.ceil(quantity/len(chapter))
    unitQuestion_Data = []
    for chap in chapter:    
        query = {
            "grade":grade,
            "course":course,
            "Chapter":chap,
            "Section":section,
            "Numerical": questionType
        }
        projection = {
            "Question": 1,
            "Chapter" : 1,
            "_id": 0
        }
        
        results = endUnitQuestion.find(query, projection).limit(questionPerTopic)
        
        for result in results:
            unitQuestion_Data.append(
                {
                    "question": result["Question"],
                    "reference": f"Chapter : {result['Chapter']}"
                }
            )
    unitQuestion_Data = unitQuestion_Data[:quantity]
    random.shuffle(unitQuestion_Data)
    return json.dumps(unitQuestion_Data, indent=4), len(unitQuestion_Data)
