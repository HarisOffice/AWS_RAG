import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { MathJax } from "better-react-mathjax";
import { handleApiRequest } from "../../hooks/generateSubmit";
export default function QuestionAssistantCard({
  grade,
  course,
  content,
  questionType,
  reference,
  generateID,
  type,
  method,
}) {
  const [open, setOpen] = useState(false); // Modal visibility
  const [question, setQuestion] = useState(""); // Content for the modal
  const [keys, setKeys] = useState({}); // Store the answers for different questions
  const [loadingState, setLoadingState] = useState({}); // Track loading state for each question
  const [buttonTextState, setButtonTextState] = useState({}); // Track button text for each question

  const handleGenerateContent = async (contentType, question) => {
    // Check if the question already exists in the keys state
    if (keys && keys[question]) {
      // If question exists, open the modal with the stored content
      handleOpen(question); // Open the modal with the stored answer
      return; // Exit early, no need to fetch data
    }

    setLoadingState((prev) => ({ ...prev, [question]: true })); // Set loading state for this question
    setButtonTextState((prev) => ({ ...prev, [question]: "Loading..." })); // Set button text to "Loading..."
    setQuestion(question); // Update question state
    let answerUrl = "http://127.0.0.1:8000/api/answer";
    const payload = { grade, course, question };

    // Call the API to get the answer
    try {
      await handleApiRequest({
        link: answerUrl,
        payload,
        formData: question,
        generateID: generateID,
        type: type,
        method: method,
        setLoading: () => {}, // We won't need to modify error handling here
        setError: () => {}, // We won't need to modify error handling here
        setContent: (data) => {
          // Save answer data in the keys state
          setKeys((prevKeys) => ({
            ...prevKeys,
            [question]: {
              key: data[0]?.key,
              solution: data[0]?.solution,
            },
          }));
          setLoadingState((prev) => ({ ...prev, [question]: false })); // Reset loading state for this question
          setButtonTextState((prev) => ({
            ...prev,
            [question]: "Show Answer Key", // Change button text to "Show Answer Key" for this question
          }));
        },
      });
    } catch (error) {
      setLoadingState((prev) => ({ ...prev, [question]: false })); // Reset loading state on error
      setButtonTextState((prev) => ({
        ...prev,
        [question]: "Show Answer Key", // Reset button text on error
      }));
    }
  };

  const handleOpen = (question) => {
    setQuestion(question); // Set the current question
    setOpen(true); // Open the modal
  };

  const handleClose = () => {
    setOpen(false); // Close the modal
  };

  return (
    <div
      style={{
        backgroundColor: "#e3f2fd", // Light blue navbar background
        padding: "16px",
      }}
    >
      {content.length > 0 ? (
        <Grid container spacing={2}>
          {content.map((q, index) => (
            <Grid item xs={12} key={index}>
              <Card
                elevation={3}
                style={{
                  backgroundColor: "#f5f5f5", // Neutral gray card background
                  borderRadius: "12px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <MathJax>
                  <CardContent>
                    <Typography variant="h6">
                      {index + 1}. {q.question}
                    </Typography>
                    {q.reference && reference ? (
                      <Typography variant="body2" color="textSecondary">
                        <strong>Reference:</strong> {q.reference}
                      </Typography>
                    ) : (
                      ""
                    )}
                  </CardContent>
                </MathJax>
                {/* Button Container */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    padding: "8px 16px",
                  }}
                >
                  {/* Show Answer Button */}
                  <Button
                    variant="contained"
                    style={{
                      width: "200px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#81c784", // Lighter blue shade
                      color: "white",
                      textTransform: "none",
                      fontWeight: "bold",
                      padding: "5px",
                    }}
                    onClick={() => handleGenerateContent("Answer", q.question)}
                    disabled={loadingState[q.question]} // Disable button based on individual question's loading state
                  >
                    {loadingState[q.question] ? (
                      <CircularProgress size={24} color="white" />
                    ) : (
                      buttonTextState[q.question] || "Generate Answer Key"
                    )}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>Nothing generated yet.</Typography>
      )}

      {/* Dialog for Answer Key */}
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <DialogTitle id="modal-title">Answer</DialogTitle>
        <MathJax>
          <DialogContent>
            <Typography variant="body1" id="modal-description">
              {/* Render the key and solution dynamically */}
              {keys[question] ? (
                <>
                  <strong>Key:</strong> {keys[question].key}
                  <br />
                  {/* {questionType === "numerical" && keys[question].solution && (
                  <>
                    <strong>Solution:</strong> {keys[question].solution}
                  </>
                )} */}
                  <strong>Solution:</strong> {keys[question].solution}
                </>
              ) : (
                <CircularProgress size={24} />
              )}
            </Typography>
          </DialogContent>
        </MathJax>

        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
