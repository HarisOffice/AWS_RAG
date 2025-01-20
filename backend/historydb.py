from pymongo import MongoClient
from dotenv import load_dotenv
import os
from collections import defaultdict

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URI")

# Connect to MongoDB
client = MongoClient(DATABASE_URL)
db = client["Board"]
books = db['ApiData']

def group_questions(questions):
    """
    Group questions by `generateID`.

    Parameters:
        questions (list): List of questions from the database.

    Returns:
        list: Grouped questions based on `generateID`.
    """
    grouped = defaultdict(list)
    for question in questions:
        generate_id = question.get("generateID")
        grouped[generate_id].append(question)

    # Convert grouped results into a list of dictionaries
    grouped_questions = []
    for generate_id, items in grouped.items():
        # Extract formdata from the items
        formdata_values = [item.get("formData") for item in items]

        # Filter formdata to include only those which are dictionaries (or objects)
        formdata_values = [f for f in formdata_values if isinstance(f, dict)]

        # If formdata is a dictionary, group them
        if formdata_values:
            grouped_questions.append({
                "generateID": generate_id,
                "formData": formdata_values[0],  # Assuming all formData for a generateID are the same
                "questions": items
            })

    return grouped_questions

def get_questions(userEmail=None, course=None, grade=None, difficulty=None, method=None, page=1, per_page=10):
    """
    Fetch and group questions from the database with optional filters and pagination.

    Parameters:
        course (str): Filter by course name.
        grade (str): Filter by grade.
        difficulty (str): Filter by difficulty level.
        method (str): Filter by question type.
        page (int): Page number (default: 1).
        per_page (int): Number of items per page (default: 10).

    Returns:
        dict: Dictionary containing grouped questions and total count.
    """
    query = {}
    if userEmail:
        query["userEmail"] = userEmail    
    if course:
        query["formData.course"] = course
    if grade:
        query["formData.grade"] = grade
    if difficulty:
        query["formData.difficulty"] = difficulty
    if method:
        query["method"] = method


    # Query the database without applying pagination first
    all_questions = list(
        books.find(query, {"_id": 0})
        .sort("generateID", -1)  # Sort by `generateID` in descending order
    )


    # Group the questions by `generateID`
    grouped_questions = group_questions(all_questions)

    # Calculate the start and end indices for pagination
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page

    # Get the requested page of groups
    paginated_groups = grouped_questions[start_idx:end_idx]

    total_count = len(grouped_questions)  # Total count of generateID groups
    return {"results": paginated_groups, "total": total_count}