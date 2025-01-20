from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json

# Load environment variables
load_dotenv()
DATABASE_URI = os.getenv("DATABASE_URI")

# Initialize MongoDB client
client = MongoClient(DATABASE_URI)
db = client["Board"]
papers = db["Content"]
apidata = db["ApiData"]

def get_chapters(grade, course):
    """
    Retrieves distinct chapters for a specific grade and course.

    Parameters:
        grade (int): The grade to filter chapters by.
        course (str): The course to filter chapters by.

    Returns:
        tuple: A JSON-formatted string of chapters and their count.
    """
    # Query to filter by grade and course and get distinct chapters
    results = papers.find(
        {"grade": grade, "course": course},  # Filter by grade and course
        {"CHAPTER": 1, "_id": 0}            # Project only the CHAPTER field
    )
    
    chapters_data = []
    unique_chapters = set()  # Set to track unique chapters

    # Loop through the results to collect distinct chapters
    for result in results:
        chapter = result.get("CHAPTER")
        if chapter and chapter not in unique_chapters:  # Ensure chapter is unique and not None
            chapters_data.append({"chapter": chapter})
            unique_chapters.add(chapter)

    # Return the JSON-formatted chapters and their count
    return json.dumps(chapters_data, indent=4), len(chapters_data)


def get_topics_for_chapters(grade, course, chapters_list):
    """
    Retrieves topics for specific chapters filtered by grade and course.

    Parameters:
        grade (int): The grade to filter by.
        course (str): The course to filter by.
        chapters_list (list): List of chapter names to retrieve topics for.

    Returns:
        tuple: A JSON-formatted string of topics per chapter and a dictionary with the count of topics for each chapter.
    """
    # Dictionary to store topics for each chapter
    chapters_topics_data = {}

    # Loop through each chapter in the provided list
    for chapter_name in chapters_list:
        # Query to filter by grade, course, and chapter
        results = papers.find(
            {"grade": grade, "course": course, "CHAPTER": chapter_name},  # Filter
            {"TOPIC": 1, "_id": 0}                                       # Project only the TOPIC field
        )
        
        topics_data = []

        # Loop through the results to collect topics
        for result in results:
            topic = result.get("TOPIC")
            if topic:  # Add only non-empty topics
                topics_data.append({"topic": topic})
        
        # Store the topics for the current chapter
        chapters_topics_data[chapter_name] = topics_data

    # Return the JSON-formatted data and the count of topics for each chapter
    return (
        json.dumps(chapters_topics_data, indent=4),
        {chapter: len(topics) for chapter, topics in chapters_topics_data.items()},
    )


def get_api_response_key(question: str):
    """
    Fetches the first valid API response for the given question with no error
    and containing both 'key' and 'solution' in the 'apiResponse'.
    
    :param question: The question to search for in the database.
    :return: A JSON object containing 'key' and 'solution' if found, else a message saying no valid result.
    """
    # Define the query to match formData
    query = {
        "formData": question
    }

    # Execute the query and fetch results
    results = apidata.find(query)

    # Filter results to find the first document with no error and with 'key' and 'solution' in 'apiResponse'
    selected_result = None
    for result in results:
        # Check if 'error' is empty and 'apiResponse' contains both 'key' and 'solution'
        if not result.get("error") and 'key' in result.get("apiResponse", [{}])[0] and 'solution' in result.get("apiResponse", [{}])[0]:
            selected_result = result
            break  # Exit the loop after finding the first valid result

    # If a valid result is found, extract the key and solution from apiResponse
    if selected_result:
        api_response = selected_result.get("apiResponse", [{}])[0]
        key = api_response.get("key")
        solution = api_response.get("solution")
        return json.dumps([{"key": key, "solution": solution}], indent=4)
    else:
        return ""


def get_latest_generateID():
    """
    Fetch the latest generateID from the ApiData collection by sorting `generateID` in descending order.
    """
    try:
        # Fetch the latest document based on `generateID` in descending order
        latest_entry = apidata.find_one({}, {"generateID": 1, "_id": 0}, sort=[("generateID", -1)])
        
        if latest_entry and "generateID" in latest_entry:
            return latest_entry["generateID"]
        return "No valid generateID found."
    except Exception as e:
        return f"Error: {str(e)}"