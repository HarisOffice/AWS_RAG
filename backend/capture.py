import io
import os
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import openai
from pymongo import MongoClient
from langchain.text_splitter import RecursiveCharacterTextSplitter
from google.cloud import vision
from pdf2image import convert_from_path
from PyPDF2 import PdfReader
import uvicorn
import json
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGO_URI = os.getenv("DATABASE_URI")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is missing from the .env file")

if not MONGO_URI:
    raise ValueError("MONGO_URI is missing from the .env file")

# Set OpenAI API Key
openai.api_key = OPENAI_API_KEY

# MongoDB connection setup
client = MongoClient(MONGO_URI)
db = client["Board"]
collection = db["Books"]

app = FastAPI()


def detect_text_in_image_content(content: bytes) -> str:
    """
    Uses Google Cloud Vision API to detect text from image bytes.
    """
    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    if response.error.message:
        raise Exception(f"API Error: {response.error.message}")
    texts = response.text_annotations
    if texts:
        return texts[0].description
    return ""

def get_embedding(text, model="text-embedding-ada-002"):
    text = text.replace("\n", " ")  # Clean up text
    response = openai.embeddings.create(input=[text], model=model)
    return response.data[0].embedding

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    # Check that the uploaded file is a PDF
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    
    tmp_path = None  # Initialize tmp_path outside the try block
    
    try:
        # Save the uploaded PDF to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        
        # Validate the PDF using PyPDF2

        try:
            reader = PdfReader(tmp_path)
            if len(reader.pages) == 0:
                raise HTTPException(status_code=400, detail="The uploaded PDF is empty or invalid.")
        except Exception:
            raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF.")
        
        # Convert PDF pages to images
        try:
            images = convert_from_path(tmp_path, poppler_path="C:\\poppler-24.08.0\\Library\\bin", use_pdftocairo=True)
        except Exception as e:
            print(f"Error during PDF conversion: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error converting PDF to images: {str(e)}")
        
        extracted_texts = {}
        # Process each page image
        for i, image in enumerate(images, start=1):
            # Save the image to a bytes buffer in PNG format
            with io.BytesIO() as output:
                image.save(output, format="PNG")
                image_bytes = output.getvalue()
            try:
                text = detect_text_in_image_content(image_bytes)
            except Exception as e:
                # Log the full error on the server side
                print(f"Error processing page {i}: {e}")
                text = f"Error processing page {i}. Please try again."
            extracted_texts[f"page_{i}"] = text
        
        # Return the extracted texts as JSON
        return JSONResponse(content={"extracted_texts": extracted_texts})
    
    except HTTPException as http_err:
        # Re-raise HTTP exceptions so they are returned to the client
        raise http_err
    except Exception as e:
        # Log the full error on the server side
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
    
    finally:
        # Ensure the temporary file is deleted even if an error occurs
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

OUTPUT_TXT_FILE = "combined_text.txt"

@app.post("/upload-json")
async def upload_json(file: UploadFile = File(...)):
    try:
        # Ensure it's a JSON file
        if not file.filename.endswith(".json"):
            raise HTTPException(status_code=400, detail="Only JSON files are allowed.")

        # Read JSON content
        contents = await file.read()
        data = json.loads(contents)

        # Check if "extracted_texts" exists
        if "extracted_texts" not in data:
            raise HTTPException(status_code=400, detail="Invalid JSON format. Missing 'extracted_texts' key.")

        # Combine all extracted text
        combined_text = "\n\n".join(data["extracted_texts"].values())

        # Save combined text to a .txt file
        with open(OUTPUT_TXT_FILE, "w", encoding="utf-8") as txt_file:
            txt_file.write(combined_text)

        return {"message": "File processed successfully", "saved_as": OUTPUT_TXT_FILE}

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-txt")
async def upload_txt(file: UploadFile = File(...)):
    try:
        # Ensure it's a text file
        if not file.filename.endswith(".txt"):
            raise HTTPException(status_code=400, detail="Only .txt files are allowed.")

        # Read text file content
        content = await file.read()
        text = content.decode("utf-8")

        # Split the text into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_text(text)

        # Process and store each chunk
        stored_chunks = []
        for split in splits:
            embedding = get_embedding(split)
            doc_embedding = {
                "text": split,
                "embedding": embedding,
                # "filename": file.filename
                "name":"computer_9.pdf"
            }
            collection.insert_one(doc_embedding)
            stored_chunks.append(doc_embedding)

        return {"message": "Embeddings stored successfully", "chunks_stored": len(stored_chunks)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)
    