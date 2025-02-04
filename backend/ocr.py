import io
import os
from google.cloud import vision

def detect_text_in_image(image_path):
    """
    Detects text in the image file located at image_path.
    """
    # Initialize the client
    client = vision.ImageAnnotatorClient()

    # Load image file content
    with io.open(image_path, 'rb') as image_file:
        content = image_file.read()

    # Create an Image object
    image = vision.Image(content=content)

    # Perform text detection on the image
    response = client.text_detection(image=image)
    
    if response.error.message:
        raise Exception(f"API Error: {response.error.message}")
    
    texts = response.text_annotations
    return texts

def main():
    # List of image paths to process
    image_paths = [
        "C:\\Users\\as\\Downloads\\page_290.png",
        # "C:\\Users\\as\\Downloads\\PXL_36.jpg"
    ]

    for image_path in image_paths:
        print(f"Processing image: {image_path}")
        try:
            texts = detect_text_in_image(image_path)
            if texts:
                # The first element is the complete OCR result for the image.
                full_text = texts[0].description
                print("Full extracted text:")
                print(full_text)
                print("-" * 80)
            else:
                print("No text detected.")
        except Exception as e:
            print(f"Error processing {image_path}: {e}")

if __name__ == '__main__':
    main()
