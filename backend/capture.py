import io
import os
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from google.cloud import vision
from pdf2image import convert_from_path
from PyPDF2 import PdfReader
import uvicorn

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

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)
