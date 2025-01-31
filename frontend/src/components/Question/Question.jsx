import React, { useState, useEffect } from "react";
import QuestionCards from "./QuestionCards";
import {
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Typography,
  Grid,
  Box,
} from "@mui/material";
import { formID } from "../../hooks/generateID";
import { handleApiRequest } from "../../hooks/generateSubmit";
import { getLocalTime } from "../../utils/time";
import {
  method,
  questionsType,
  grades,
  courses,
  chapters,
  difficulty,
} from "../../utils/formData";
export default function Question() {
  const [formData, setFormData] = useState({
    type: "Short",
    grade: "9",
    course: "Physics",
    numberOfQuestions: 1,
    chapter: "Gravitation",
    difficulty: "easy",
    method: "paper",
  });
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateID, setGenerateID] = useState();

  useEffect(() => {
    const generateFormID = async () => {
      try {
        await formID({
          setGenerateID,
        });
      } catch (error) {
        console.error("Error generating ID:", error);
      }
    };

    generateFormID(); // Call the async function
  }, [setGenerateID, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContent([]);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    const method = "subjective";
    e.preventDefault();

    const payload = {
      grade: parseInt(formData.grade, 10),
      course: formData.course,
      quantity: parseInt(formData.numberOfQuestions, 10),
      chapter: formData.chapter,
      type: formData.type,
      difficulty: formData.difficulty,
    };

    let link;
    let type;

    if (formData.type === "Short" && formData.method === "book") {
      link = "https://ai.myedbox.com/api/short";
    } else if (formData.type === "Long" && formData.method === "book") {
      link = "https://ai.myedbox.com/api/long";
    } else if (formData.type === "Numerical" && formData.method === "book") {
      link = "https://ai.myedbox.com/api/numerical";
    } else {
      link = "https://ai.myedbox.com/api/paper";
    }

    if (formData.type === "Short") {
      type = "descriptive";
    } else if (formData.type === "Long") {
      type = "long";
    } else if (formData.type === "Numerical") {
      type = "numerical";
    }

    await handleApiRequest({
      link,
      payload,
      formData,
      setError,
      setContent,
      setLoading,
      generateID,
      type,
      method,
    });
  };

  return (
    <Box p={4} sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <Grid container spacing={4}>
        {/* Form Section */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 3,
              backgroundColor: "#fff",
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Short & Long Questions Generator
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="grade"
                    select
                    label="Grade"
                    value={formData.grade}
                    onChange={handleChange}
                  >
                    {grades.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="course"
                    select
                    label="Course"
                    value={formData.course}
                    onChange={handleChange}
                  >
                    {courses.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="type"
                    select
                    label="Type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    {questionsType.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="method"
                    select
                    label="Method"
                    value={formData.method}
                    onChange={handleChange}
                  >
                    {method.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {formData.method === "book" ? (
                  <Grid item xs={12} md={12}>
                    <TextField
                      fullWidth
                      name="difficulty"
                      select
                      label="Difficulty"
                      value={formData.difficulty}
                      onChange={handleChange}
                    >
                      {difficulty.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                ) : (
                  ""
                )}

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="numberOfQuestions"
                    label="Number of Questions"
                    type="number"
                    value={formData.numberOfQuestions}
                    onChange={handleChange}
                    inputProps={{ min: 1, max: 10 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="chapter"
                    select
                    label="Chapter"
                    variant="outlined"
                    value={formData.chapter}
                    onChange={handleChange}
                  >
                    {chapters.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ py: 1.5 }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : "Generate"}
                  </Button>
                </Grid>
                <Grid item xs={12} md={12}>
                  <Typography color="info" className="py-3">
                    <b>Note:</b> In the "Paper" Method, questions from past
                    papers are retrieved based on availability. If a chapter has
                    fewer questions than requested, only the available ones will
                    be provided.
                  </Typography>
                </Grid>
                {error && (
                  <Grid item xs={12}>
                    <Typography color="error">{error}</Typography>
                  </Grid>
                )}
              </Grid>
            </form>
          </Box>
        </Grid>

        {/* MCQs Display Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            {formData.type === "Short"
              ? "Generated Short Questions"
              : formData.type === "Long"
                ? "Generated Long Questions"
                : "Generated Numerical Questions"}
          </Typography>
          <QuestionCards content={content} />
        </Grid>
      </Grid>
    </Box>
  );
}
