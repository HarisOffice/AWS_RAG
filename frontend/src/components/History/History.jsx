import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Popover,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  Backdrop,
  CircularProgress,
  Tooltip,
  IconButton,
  Divider,
} from "@mui/material";
import {
  AccessTime,
  CheckCircleOutline,
  HelpOutline,
  RadioButtonChecked,
  TextFields,
  ShortText,
  Calculate,
  Article,
  Notes,
} from "@mui/icons-material";
import { MathJax } from "better-react-mathjax";

export default function History() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    course: "",
    grade: "",
    type: "",
    difficulty: "",
  });
  const [historyData, setHistoryData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(false); // State to manage loading
  const itemsPerPage = 5;

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleCardClick = (item) => {
    setSelectedDetail(item);
  };

  const handleExport = (item) => {
    console.log("Navigating to export with item:", item); // Debugging
    navigate("/export", { state: { generateID: item.generateID } });
  };

  const handleDialogClose = () => {
    setSelectedDetail(null);
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, filters, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true); // Show loading backdrop
      const queryParams = new URLSearchParams({
        page: currentPage,
        userEmail: user.email,
        course: filters.course,
        grade: filters.grade,
        difficulty: filters.difficulty,
        method: filters.type,
      });
      const response = await fetch(
        `https://ai.myedbox.com/api/history?${queryParams.toString()}`
      );
      const data = await response.json();
      setHistoryData(data.questions || []);
      setTotalItems(data.total);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false); // Hide loading backdrop
    }
  };

  const getIconForQuestionType = (type) => {
    switch (type) {
      case "mcqs":
        return (
          <RadioButtonChecked
            sx={{ fontSize: 20, verticalAlign: "middle", color: "#388e3c" }}
          />
        );
      case "blanks":
        return (
          <TextFields
            sx={{ fontSize: 20, verticalAlign: "middle", color: "#388e3c" }}
          />
        );
      case "descriptive":
        return (
          <ShortText
            sx={{ fontSize: 20, verticalAlign: "middle", color: "#388e3c" }}
          />
        );
      case "numerical":
        return (
          <Calculate
            sx={{ fontSize: 20, verticalAlign: "middle", color: "#388e3c" }}
          />
        );
      case "long":
        return (
          <Article
            sx={{ fontSize: 20, verticalAlign: "middle", color: "#388e3c" }}
          />
        );
      case "short":
        return (
          <Notes
            sx={{ fontSize: 20, verticalAlign: "middle", color: "#388e3c" }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f9f9f9" }}>
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: "blur(4px)", // Add blur effect
        }}
        open={loading} // Show when loading is true
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box sx={{ maxWidth: "1200px", mx: "auto", p: 4 }}>
        {/* Main Card */}
        <Card
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 4,
            boxShadow: 3,
            backgroundColor: "#f9f9f9",
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography
            variant="h4"
            sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}
          >
            Question History
          </Typography>

          {/* Filters Section */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: "center",
            }}
          >
            {/* Filters Button */}
            <Button
              variant="contained"
              color="primary"
              onClick={handlePopoverOpen}
              startIcon={<Filter size={16} />}
              sx={{
                textTransform: "none",
                fontWeight: "bold",
                borderRadius: 2,
                boxShadow: 2,
              }}
            >
              Filters
            </Button>

            {/* Popover for Filters */}
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              PaperProps={{
                elevation: 3,
                sx: { borderRadius: 3 },
              }}
            >
              <Box
                sx={{
                  p: 3,
                  width: 300,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {/* Course Filter */}
                <FormControl fullWidth>
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={filters.course}
                    label="Course"
                    onChange={(e) =>
                      setFilters({ ...filters, course: e.target.value })
                    }
                    sx={{
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem value="">All Courses</MenuItem>
                    <MenuItem value="Physics">Physics</MenuItem>
                    <MenuItem value="Mathematics">Mathematics</MenuItem>
                    <MenuItem value="Chemistry">Chemistry</MenuItem>
                  </Select>
                </FormControl>

                {/* Grade Filter */}
                <FormControl fullWidth>
                  <InputLabel>Grade</InputLabel>
                  <Select
                    value={filters.grade}
                    label="Grade"
                    onChange={(e) =>
                      setFilters({ ...filters, grade: e.target.value })
                    }
                    sx={{
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem value="">All Grades</MenuItem>
                    <MenuItem value="9">Grade 9</MenuItem>
                    <MenuItem value="10">Grade 10</MenuItem>
                    <MenuItem value="11">Grade 11</MenuItem>
                    <MenuItem value="12">Grade 12</MenuItem>
                  </Select>
                </FormControl>

                {/* Difficulty Filter */}
                <FormControl fullWidth>
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    value={filters.difficulty}
                    label="Difficulty"
                    onChange={(e) =>
                      setFilters({ ...filters, difficulty: e.target.value })
                    }
                    sx={{
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem value="">All Difficulties</MenuItem>
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                  </Select>
                </FormControl>

                {/* Tools Filter */}
                <FormControl fullWidth>
                  <InputLabel>Tools</InputLabel>
                  <Select
                    value={filters.type}
                    label="Type"
                    onChange={(e) =>
                      setFilters({ ...filters, type: e.target.value })
                    }
                    sx={{
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem value="">All Tools</MenuItem>
                    <MenuItem value="assistant">Assistant</MenuItem>
                    <MenuItem value="objective">Objective</MenuItem>
                    <MenuItem value="subjective">Subjective</MenuItem>
                    <MenuItem value="paper">Paper</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Popover>
          </Box>
        </Card>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {historyData.map((item) => (
            <Card
              key={item.generateID}
              sx={{
                borderRadius: 4,
                boxShadow: 3,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: 8,
                  transform: "scale(1.02)",
                  cursor: "pointer",
                },
                backgroundColor: "#ffffff",
                overflow: "hidden",
              }}
              onClick={() => handleCardClick(item)}
            >
              {/* Card Header */}
              <CardHeader
                title={
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "bold", color: "#1976d2" }}
                    >
                      Query #{item.generateID}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {item.formData.chapters && (
                        <Box
                          sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: 16,
                            bgcolor: "primary.light",
                            color: "primary.contrastText",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "primary.main" },
                          }}
                        >
                          <Tooltip
                            title={item.formData.chapters.join(", ")}
                            arrow
                          >
                            <Box
                              sx={{
                                display: "inline-block",
                                px: 2,
                                py: 0.5,
                                bgcolor: "primary.light",
                                color: "primary.contrastText",
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: "pointer",
                                "&:hover": {
                                  bgcolor: "primary.main",
                                },
                              }}
                            >
                              {item.formData.chapters.length} Chapters
                            </Box>
                          </Tooltip>
                        </Box>
                      )}
                      {item.formData.topics && (
                        <Box
                          sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: 16,
                            bgcolor: "primary.light",
                            color: "primary.contrastText",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "primary.main" },
                          }}
                        >
                          <Tooltip
                            title={
                              item.formData.topics[0]
                                ? item.formData.topics.join(", ")
                                : item.formData.years.join(", ")
                            }
                            arrow
                          >
                            <Box
                              sx={{
                                display: "inline-block",
                                px: 2,
                                py: 0.5,
                                bgcolor: "primary.light",
                                color: "primary.contrastText",
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: "pointer",
                                "&:hover": {
                                  bgcolor: "primary.main",
                                },
                              }}
                            >
                              {item.formData.topics[0]
                                ? item.formData.topics.length + " Topics"
                                : item.formData.years.length + " Years"}
                            </Box>
                          </Tooltip>
                        </Box>
                      )}

                      <Box
                        sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: 16,
                          bgcolor: "success.light",
                          color: "success.contrastText",
                          fontWeight: "bold",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          "&:hover": { bgcolor: "success.main" },
                        }}
                      >
                        Grade {item.formData.grade}
                      </Box>
                      <Box
                        sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: 16,
                          bgcolor: "secondary.light",
                          color: "secondary.contrastText",
                          fontWeight: "bold",
                          fontSize: "0.9rem",
                        }}
                      >
                        {item.formData.difficulty}
                      </Box>
                    </Box>
                  </Box>
                }
                subheader={
                  <Typography
                    sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                  >
                    Last modified: {item.questions[0].timestamp}
                  </Typography>
                }
              />
              <Divider />

              {/* Card Content */}
              <CardContent>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                    gap: 3,
                  }}
                >
                  {/* Questions */}
                  <Box>
                    <Typography
                      color="text.secondary"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      Questions
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {item.questions[0].method === "assistant" ? (
                        <>
                          <Typography>
                            MCQs: {item.formData.numberOfMCQs}
                          </Typography>
                          <Typography>
                            Blanks: {item.formData.numberOfBlanks}
                          </Typography>
                          <Typography>
                            Short: {item.formData.numberOfDescriptive}
                          </Typography>
                          <Typography>
                            Numericals: {item.formData.numberOfNumericals}
                          </Typography>
                          <Typography>
                            Long: {item.formData.numberOfLong}
                          </Typography>
                        </>
                      ) : item.questions[0].method === "objective" &&
                        item.formData.type === "mcqs" ? (
                        <Typography>
                          MCQs: {item.formData.numberOfQuestions}
                        </Typography>
                      ) : item.questions[0].method === "objective" &&
                        item.formData.type === "blanks" ? (
                        <Typography>
                          Blanks: {item.formData.numberOfQuestions}
                        </Typography>
                      ) : item.questions[0].method === "subjective" &&
                        item.formData.type === "Short" ? (
                        <Typography>
                          Short: {item.formData.numberOfQuestions}
                        </Typography>
                      ) : item.questions[0].method === "subjective" &&
                        item.formData.type === "Numerical" ? (
                        <Typography>
                          Numericals: {item.formData.numberOfQuestions}
                        </Typography>
                      ) : item.questions[0].method === "subjective" &&
                        item.formData.type === "Long" ? (
                        <Typography>
                          Long: {item.formData.numberOfQuestions}
                        </Typography>
                      ) : item.questions[0].method === "paper" ? (
                        <>
                          <Typography>MCQs: 12</Typography>
                          <Typography>
                            Short: {10 - item.formData.numberOfNumericals}
                          </Typography>
                          <Typography>
                            Numericals: {item.formData.numberOfNumericals}
                          </Typography>
                          <Typography>Long: 6</Typography>
                        </>
                      ) : (
                        ""
                      )}
                    </Box>
                  </Box>

                  {/* Details */}
                  <Box>
                    <Typography
                      color="text.secondary"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      Details
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      {item.questions[0].method && (
                        <Typography>
                          Tool: {item.questions[0].method}
                        </Typography>
                      )}
                      {item.formData.method && (
                        <Typography>Method: {item.formData.method}</Typography>
                      )}
                      {item.formData.outputType && (
                        <Typography>
                          Type: {item.formData.outputType}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Extra Details */}
                  <Box>
                    <Typography
                      color="text.secondary"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      Metadata
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}
                    >
                      <Typography>
                        Time:{" "}
                        <Box component="span" sx={{ color: "success.main" }}>
                          {item.questions[0].timestamp}
                        </Box>
                      </Typography>
                      <Typography>
                        Reference:{" "}
                        {item.formData.reference ? (
                          <Box component="span" sx={{ color: "success.main" }}>
                            True
                          </Box>
                        ) : (
                          <Box component="span" sx={{ color: "error.main" }}>
                            False
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleExport(item)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 16,
                      px: 3,
                      py: 1,
                      fontWeight: "bold",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    }}
                  >
                    Export
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={Math.ceil(totalItems / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            variant="outlined"
            color="primary"
            size="large"
          />
        </Box>
        <Dialog
          open={selectedDetail !== null}
          onClose={handleDialogClose}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Question Detail</DialogTitle>
          <MathJax>
            <DialogContent>
              {selectedDetail && (
                <Box sx={{ py: 2 }}>
                  {selectedDetail.questions
                    .sort(
                      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
                    ) // Sort by timestamp
                    .map((questionData, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 4,
                          p: 3,
                          borderRadius: "12px",
                          backgroundColor: "#f5f5f5",
                          boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
                        }}
                      >
                        {/* Request Header */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: "bold",
                              color: "#3f51b5",
                              mb: 1,
                            }}
                          >
                            Request #{index + 1}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#757575" }}>
                            <AccessTime
                              sx={{ fontSize: 16, verticalAlign: "middle" }}
                            />{" "}
                            {questionData.timestamp}
                          </Typography>
                        </Box>

                        {/* Divider */}
                        <Divider sx={{ my: 2 }} />

                        {/* Questions/Answers Section */}
                        {!questionData.error &&
                          questionData.apiResponse.map((q, idx) => (
                            <Box key={idx} sx={{ mt: 2 }}>
                              {/* Question or Answer */}
                              {q.question ? (
                                <Typography sx={{ mb: 1, color: "#333" }}>
                                  <HelpOutline
                                    sx={{
                                      fontSize: 20,
                                      verticalAlign: "middle",
                                      color: "#4caf50",
                                    }}
                                  />{" "}
                                  <strong>Question:</strong> {q.question}
                                </Typography>
                              ) : (
                                <>
                                  <Typography sx={{ mb: 1, color: "#333" }}>
                                    <CheckCircleOutline
                                      sx={{
                                        fontSize: 20,
                                        verticalAlign: "middle",
                                        color: "#388e3c",
                                      }}
                                    />{" "}
                                    <strong>Answer Generate:</strong>{" "}
                                    {questionData.formData}
                                  </Typography>
                                  {q.key && (
                                    <Typography sx={{ mb: 1, color: "#333" }}>
                                      <strong>Key:</strong> {q.key}
                                    </Typography>
                                  )}
                                  {q.solution && (
                                    <Typography sx={{ mb: 1, color: "#333" }}>
                                      <strong>Solution:</strong> {q.solution}
                                    </Typography>
                                  )}
                                </>
                              )}

                              {/* Options */}
                              {q.options && q.options.length > 0 && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    backgroundColor: "#e3f2fd",
                                    p: 2,
                                    borderRadius: "8px",
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      mb: 1,
                                      fontWeight: "bold",
                                      color: "#1976d2",
                                    }}
                                  >
                                    Options:
                                  </Typography>
                                  {q.options.slice(0, 4).map((option, i) => (
                                    <Typography key={i} sx={{ ml: 2 }}>
                                      {i + 1}. {option}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              {questionData.type && (
                                <Typography sx={{ mt: 1, color: "#388e3c" }}>
                                  {getIconForQuestionType(questionData.type)}{" "}
                                  <strong>Type:</strong> {questionData.type}
                                </Typography>
                              )}

                              {/* Correct Answer */}
                              {q.correct_answer && (
                                <Typography sx={{ mt: 1, color: "#388e3c" }}>
                                  <CheckCircleOutline
                                    sx={{
                                      fontSize: 20,
                                      verticalAlign: "middle",
                                      color: "#388e3c",
                                    }}
                                  />{" "}
                                  <strong>Correct Answer:</strong>{" "}
                                  {q.correct_answer}
                                </Typography>
                              )}

                              {/* Reference */}
                              {q.reference && (
                                <Typography sx={{ mt: 1, color: "#616161" }}>
                                  <strong>Reference:</strong> {q.reference}
                                </Typography>
                              )}
                            </Box>
                          ))}

                        {/* Timestamp & API Response Time */}
                        <Box
                          sx={{
                            mt: 2,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography
                            sx={{ fontSize: "0.9rem", color: "#757575" }}
                          >
                            <strong>Timestamp:</strong> {questionData.timestamp}
                          </Typography>
                          <Typography
                            sx={{ fontSize: "0.9rem", color: "#757575" }}
                          >
                            <strong>API Response Time:</strong>{" "}
                            {questionData.apiResponseTime} seconds
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                </Box>
              )}
            </DialogContent>
          </MathJax>
        </Dialog>
      </Box>
    </Box>
  );
}
