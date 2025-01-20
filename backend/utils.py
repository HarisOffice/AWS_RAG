import json
import re

def mcqs(text):
    lines = text.split('\n')
    questions_data = []
    current_question = {}
    for line in lines:
        # Match new question or ending with a question mark
        if (re.match(r'^\d+\.', line.strip()) and '**' not in line) or line.strip().endswith('?'):
            if current_question:
                questions_data.append(current_question)
            current_question = {
                "question": line[3:].strip(),  # Extract question text
                "options": [],
                "correct_answer": "",
                "reference": ""  # Add reference field
            }
        elif 'Correct Answer:' in line:
            current_question["correct_answer"] = line.split('Correct Answer:')[1].strip()
        elif line.find('A)') != -1:
            current_question["options"].append(line[line.find('A)') + 3:].strip())
        elif line.find('B)') != -1:
            current_question["options"].append(line[line.find('B)') + 3:].strip())
        elif line.find('C)') != -1:
            current_question["options"].append(line[line.find('C)') + 3:].strip())
        elif line.find('D)') != -1:
            current_question["options"].append(line[line.find('D)') + 3:].strip())
        elif 'Reference:' in line:  
            current_question["reference"] = line.split('Reference:')[1].strip()

    # Append the last question if not already added
    if current_question:
        questions_data.append(current_question)
        
    # with open('questions.json', 'w') as file:
    #     json.dump(questions_data, file, indent=4)

    print("Questions extracted")
    return json.dumps(questions_data, indent=4)



def blanks(text):
    lines = text.split('\n')
    questions_data = []
    current_question = {}
    for line in lines:
        print(line)
        if (re.match(r'^\d+\.', line.strip()) and '**' not in line) or line.strip().endswith('?'):
            print(line)
            if current_question:
                questions_data.append(current_question)
            current_question = {"question": line[3:].strip(), "correct_answer": "","reference": ""}
        elif (line.find('Correct Answer:') != -1):
            current_question["correct_answer"] = line.split(': ')[1].strip().split('**')[0].strip()
        elif 'Reference:' in line:  # Extract reference information
            current_question["reference"] = line.split('Reference:')[1].strip()

    if current_question:
        questions_data.append(current_question)
    
    # with open('questions.json', 'w') as file:
    #     json.dump(questions_data, file, indent=4)

    print("Questions extracted")
    
    return json.dumps(questions_data, indent=4)



def questions(text):
    # print(text)
    lines = text.split('\n')
    questions_data = []
    current_question = {}
    for line in lines:
        if (re.match(r'^\d+\.', line.strip()) and '**' not in line) or line.strip().endswith('?'):
            print(line)
            if current_question:
                questions_data.append(current_question)
            current_question = {"question": line[3:].strip()} 
        elif 'Reference:' in line:  
            current_question["reference"] = line.split('Reference:')[1].strip()

    if current_question:
        questions_data.append(current_question)
    
    # with open('questions.json', 'w') as file:
    #     json.dump(questions_data, file, indent=4)
    
    print("Questions extracted")
    
    return json.dumps(questions_data, indent=4)

def answerkey(text):
    lines = text.split('\n')
    print(text)
    data = []
    current_item = {}
    capturing_solution = ""

    for line in lines:
        line = line.strip()

        # Detect the solution start and capture solution lines
        if 'Solution:' in line:
            if current_item:
                # If an answer key is already captured, store it and start a new item
                data.append(current_item)
            current_item = {
                "solution": line.split('Solution:')[-1].strip(),  # Capture the solution after "Solution:"
                "key": "",  # Start with an empty answer key
            }
            capturing_solution = "solution"  # Start capturing multi-line solution
        
        # Capture the answer key after the solution
        elif 'Answer Key:' in line:
            if current_item and capturing_solution:
                # Set the answer key after the solution is captured
                current_item["key"] = line.split('Answer Key:')[-1].strip()
                capturing_solution = "answer"  # Stop capturing solution after the answer key is found
        
        # Append additional lines to the solution
        elif capturing_solution=="solution" and current_item:
            current_item["solution"] += f" {line}"
            
        elif capturing_solution=="answer" and current_item:
            current_item["key"] += f" {line}"

    # Append the last item if it exists
    if current_item:
        data.append(current_item)

    # Return the result as a JSON string
    print("Answer keys and solutions extracted")
    return json.dumps(data, indent=4)
