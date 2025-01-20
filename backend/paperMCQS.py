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
paper_mcq = db["PaperMCQs"]
#function to fetch mcqs from past papers
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