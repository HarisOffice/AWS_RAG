from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
DATABASE_URI = os.getenv("DATABASE_URI")

# Initialize MongoDB client
client = MongoClient(DATABASE_URI)
dbCsv = client["Board"]
papers = dbCsv["EndUnitQuestions"]

# Update all documents to add the field "grade" with value 9
update_result = papers.update_many({}, {"$set": {"course": "Physics"}})

# Print the result of the update
print(f"Matched {update_result.matched_count} documents, modified {update_result.modified_count} documents.")
