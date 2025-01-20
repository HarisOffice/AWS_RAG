import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph } from "docx";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import {
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Typography,
  Box,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Backdrop,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Input,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import {MathJax} from "better-react-mathjax";
const SelectField = ({ label, name, value, options, onChange }) => (
  <FormControl fullWidth margin="normal">
    <InputLabel>{label}</InputLabel>
    <Select name={name} value={value} onChange={onChange}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// Placeholder data for the select inputs (replace with actual data)
const grades = [
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
];
const courses = [
  { value: "Physics", label: "Physics" },
  { value: "Mathematics", label: "Mathematics" },
];

export default function ExportPaper() {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const { generateID } = location.state || {};
  const [formData, setFormData] = useState({
    grade: "",
    course: "",
    type: "",
    heading: "",
    subHeading: "",
    time: "",
    marks: "",
    sectionB: "",
    sectionC: "",
    fileName: "paper",
    marksA: 0,
    marksB: 0,
    marksC: 0,
    marksChoiceA: 0,
    marksChoiceB: 0,
    marksChoiceC: 0,
    paperSize: "a4",
  });
  if (generateID && !formData.type) {
    formData.type = generateID; // Update the generateID value
    console.log("well");
  } else {
    console.log("none");
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logo, setLogo] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [papers, setPapers] = useState([]);
  const [matchedData, setMatchedData] = useState(null);
  const [sectionA, setSectionA] = useState(null);
  const [sectionB, setSectionB] = useState(null);
  const [sectionC, setSectionC] = useState(null);
  const [marksA, setMarksA] = useState(null);
  const [marksB, setMarksB] = useState(null);
  const [marksC, setMarksC] = useState(null);
  const [totalMarks, setTotalMarks] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  let globalA = 1;
  let globalB = 1;

  const fetchData = async () => {
    try {
      setLoading(true); // Show loading backdrop
      const queryParams = new URLSearchParams({
        userEmail: user.email,
        grade: formData.grade,
        course: formData.course,
      });
      const response = await fetch(
        `http://127.0.0.1:8000/api/history?${queryParams.toString()}`
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

  useEffect(() => {
    fetchData();
  }, [formData.grade, formData.course]);

  useEffect(() => {
    const generateIDs = historyData.map((item) => item.generateID);
    setPapers(generateIDs);
  }, [historyData]);

  useEffect(() => {
    if (formData.type) {
      const foundData = historyData.find(
        (item) => item.generateID === parseInt(formData.type, 10)
      );
      setMatchedData(foundData); // Set matched data to state
    }
  }, [formData.type, historyData]);

  useEffect(() => {
    let totalSectionA = 0;
    let totalSectionB = 0;
    let totalSectionC = 0;

    matchedData?.questions.forEach((questionData) => {
      if (
        typeof questionData.formData === "object" &&
        questionData?.type === "mcqs" &&
        !questionData?.error
      ) {
        totalSectionA += questionData?.apiResponse?.length || 0;
      }
      if (
        typeof questionData.formData === "object" &&
        questionData?.type === "blanks" &&
        !questionData?.error
      ) {
        totalSectionA += questionData?.apiResponse?.length || 0;
      }
      if (
        typeof questionData.formData === "object" &&
        questionData?.type === "descriptive" &&
        !questionData?.error
      ) {
        totalSectionB += questionData?.apiResponse?.length || 0;
      }
      if (
        typeof questionData.formData === "object" &&
        questionData?.type === "numerical" &&
        !questionData?.error
      ) {
        totalSectionB += questionData?.apiResponse?.length || 0;
      }
      if (
        typeof questionData.formData === "object" &&
        questionData?.type === "short" &&
        !questionData?.error
      ) {
        totalSectionB = questionData?.apiResponse?.length || 0;
      }
      if (
        typeof questionData.formData === "object" &&
        questionData?.type === "long" &&
        !questionData?.error
      ) {
        totalSectionC += questionData?.apiResponse?.length || 0;
      }
    });

    setSectionA(totalSectionA);
    setSectionB(totalSectionB);
    setSectionC(totalSectionC);
  }, [matchedData]);

  useEffect(() => {
    setTotalMarks(marksA + marksB + marksC);
  }, [marksA, marksB, marksC]);

  function calculateTotalMarksSection({ value, section, marksChoice }) {
    const totalMarks = value * (section - parseInt(marksChoice, 10));
    return totalMarks;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "marksA") {
      const totalMarks = calculateTotalMarksSection({
        value: value,
        section: sectionA,
        marksChoice: formData.marksChoiceA,
      });
      setMarksA(totalMarks);
    }
    if (name === "marksB") {
      const totalMarks = calculateTotalMarksSection({
        value: value,
        section: sectionB,
        marksChoice: formData.marksChoiceB,
      });
      setMarksB(totalMarks);
    }
    if (name === "marksC") {
      const totalMarks = calculateTotalMarksSection({
        value: value,
        section: sectionC,
        marksChoice: formData.marksChoiceC,
      });
      setMarksC(totalMarks);
    }
    if (name === "marksChoiceA") {
      const totalMarks = calculateTotalMarksSection({
        value: parseInt(formData.marksA, 10),
        section: sectionA,
        marksChoice: parseInt(value, 10),
      });
      setMarksA(totalMarks);
    }
    if (name === "marksChoiceB") {
      const totalMarks = calculateTotalMarksSection({
        value: parseInt(formData.marksB, 10),
        section: sectionB,
        marksChoice: parseInt(value, 10),
      });
      setMarksB(totalMarks);
    }
    if (name === "marksChoiceC") {
      const totalMarks = calculateTotalMarksSection({
        value: parseInt(formData.marksC, 10),
        section: sectionC,
        marksChoice: parseInt(value, 10),
      });
      setMarksC(totalMarks);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const downloadPDF = () => {
    const paperSize = formData.paperSize || "a4";
    const element = document.getElementById("exam-paper");
    const doc = new jsPDF("p", "pt", paperSize); // Use the paperSize parameter

    // Render the content from the element to the PDF
    doc.html(element, {
      html2canvas: {
        scale: 0.72, // Adjust scaling if needed (increased from 0.25)
      },
      margin: [20, 20, 20, 20], // Adjust margins as needed
      // autoPaging: "text", // Enable auto page breaking
      width: 700, // Reduce width to fit better (adjust this value)
      windowWidth: 750, // Adjust the windowWidth to prevent overflow
      callback: function (doc) {
        // Save the document after rendering
        // window.open(doc.output('bloburl'));
        doc.save(formData.fileName + ".pdf");
      },
    });
  };

  /** Convert PDF into base64 */
  // const base64PDF = await doc.output('datauristring');

  const downloadWordDocument = () => {
    const element = document.getElementById("exam-paper");
    if (!element) {
      console.error("Element with id 'exam-paper' not found.");
      return;
    }

    // Function to process HTML elements and create document elements
    const processContent = (element) => {
      const children = [];

      // Process each child element
      Array.from(element.children).forEach((child) => {
        // Handle different types of elements
        switch (child.tagName.toLowerCase()) {
          case "h1":
            children.push(
              new Paragraph({
                text: child.textContent,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 240, after: 120 },
                bold: true,
                size: 32,
              })
            );
            break;

          case "h2":
            children.push(
              new Paragraph({
                text: child.textContent,
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
                bold: true,
                size: 28,
              })
            );
            break;

          case "div":
            if (child.classList.contains("question-container")) {
              // Handle question containers
              const questionNumber =
                child.querySelector(".question-number")?.textContent || "";
              const questionText =
                child.querySelector(".question-text")?.textContent || "";
              const options = Array.from(child.querySelectorAll(".option"));

              children.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${questionNumber}. `,
                      bold: true,
                    }),
                    new TextRun({
                      text: questionText,
                    }),
                  ],
                  spacing: { before: 240, after: 120 },
                })
              );

              // Add options if present
              options.forEach((option, index) => {
                children.push(
                  new Paragraph({
                    text: `${String.fromCharCode(65 + index)}. ${option.textContent}`,
                    spacing: { before: 120, after: 120 },
                    indent: { left: 720 }, // Indent options
                  })
                );
              });
            }
            break;

          case "p":
            children.push(
              new Paragraph({
                text: child.textContent,
                spacing: { before: 120, after: 120 },
              })
            );
            break;

          // Add more cases for other element types as needed
        }
      });

      return children;
    };

    // Create header with title and date
    const header = new Header({
      children: [
        new Paragraph({
          text: formData.fileName || "Exam Paper",
          alignment: AlignmentType.CENTER,
          bold: true,
        }),
        new Paragraph({
          text: new Date().toLocaleDateString(),
          alignment: AlignmentType.RIGHT,
        }),
      ],
    });

    // Create footer with page numbers
    const footer = new Footer({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              children: [
                "Page ",
                PageNumber.CURRENT,
                " of ",
                PageNumber.TOTAL_PAGES,
              ],
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });

    // Create the document with proper styling
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          headers: {
            default: header,
          },
          footers: {
            default: footer,
          },
          children: processContent(element),
        },
      ],
    });

    // Generate and download the document
    Packer.toBlob(doc)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${formData.fileName || "Exam_Paper"}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error generating Word document:", error);
      });
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result); // Set the image source to the result
      };
      reader.readAsDataURL(file); // Read the file as a data URL (base64)
    } else {
      alert("Please upload a valid image file (JPEG/PNG).");
    }
  };

  const toRomanUrdu = (num) => {
    const romanUrduNumerals = [
      ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix"],
      ["", "x", "xx", "xxx", "xl", "l", "lx", "lxx", "lxxx", "xc"],
      ["", "c", "cc", "ccc", "cd", "d", "dc", "dcc", "dccc", "cm"],
      ["", "m"],
    ];
    let romanUrdu = "";
    let i = 0;

    while (num > 0) {
      const digit = num % 10;
      if (digit > 0) {
        romanUrdu = romanUrduNumerals[i][digit] + romanUrdu;
      }
      num = Math.floor(num / 10);
      i++;
    }
    return romanUrdu;
  };

  return (
    <Box
      p={4}
      sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh", display: "flex" }}
    >
      <Backdrop open={loading} sx={{ zIndex: 1200 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Grid container spacing={2}>
        {/* Left Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Create a Paper
            </Typography>
            <form>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Grade</InputLabel>
                    <Select
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                    >
                      {grades.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Course</InputLabel>
                    <Select
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                    >
                      {courses.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={12}>
                  <SelectField
                    label="Select Paper"
                    name="type"
                    value={formData.type}
                    options={papers.map((paper) => ({
                      value: paper,
                      label: `Query ${paper}`,
                    }))}
                    onChange={handleChange}
                  />
                  {error && <Typography color="error">{error}</Typography>}
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    label="Page Heading"
                    name="heading"
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    label="Page SubHeading"
                    name="subHeading"
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    label="Time"
                    name="time"
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    label="Note for Section B"
                    name="sectionB"
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    label="Note for Section C"
                    name="sectionC"
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <SelectField
                    label="Paper Size"
                    name="paperSize"
                    value={formData.paperSize}
                    options={[
                      { value: "a4", label: "A4" },
                      { value: "legal", label: "Legal" },
                    ]}
                    onChange={handleChange}
                  />
                  {error && <Typography color="error">{error}</Typography>}
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="File Name"
                    name="fileName"
                    value={formData.fileName}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                  />
                  {error && <Typography color="error">{error}</Typography>}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box>
                    {/* Upload Logo Button */}
                    <Button
                      variant="contained"
                      color="primary"
                      component="label"
                      size="large"
                    >
                      Upload Logo
                      <Input
                        type="file"
                        accept="image/jpeg, image/png"
                        hidden
                        onChange={handleFileChange}
                      />
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6} mb={2}>
                  {/* Display the uploaded logo */}
                  {imageSrc && (
                    <Box>
                      <img
                        src={imageSrc}
                        alt="Logo"
                        style={{
                          maxWidth: "150px",
                          maxHeight: "150px",
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                  )}
                </Grid>
                {sectionA > 0 || sectionB > 0 || sectionC > 0 ? (
                  <>
                    <Grid item xs={12} md={12}>
                      <Typography color="info" className="text-center">
                        Marks of Each Question (Each Section)
                      </Typography>
                    </Grid>
                    {sectionA > 0 ? (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Section A"
                          name="marksA"
                          onChange={handleChange}
                          fullWidth
                          margin="normal"
                          type="number"
                          inputProps={{ min: 0, max: 10 }}
                        />
                      </Grid>
                    ) : (
                      ""
                    )}
                    {sectionB > 0 ? (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Section B"
                          name="marksB"
                          onChange={handleChange}
                          fullWidth
                          margin="normal"
                          type="number"
                          inputProps={{ min: 0, max: 10 }}
                        />
                      </Grid>
                    ) : (
                      ""
                    )}
                    {sectionC > 0 ? (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Section C"
                          name="marksC"
                          onChange={handleChange}
                          fullWidth
                          margin="normal"
                          type="number"
                          inputProps={{ min: 0, max: 10 }}
                        />
                      </Grid>
                    ) : (
                      ""
                    )}
                    <Grid item xs={12} md={12}>
                      <Typography color="info" className="text-center">
                        Number of Questions to exclude out of total (Choice)
                      </Typography>
                    </Grid>
                    {sectionA > 0 && formData.marksA > 0 ? (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Section A"
                          name="marksChoiceA"
                          onChange={handleChange}
                          fullWidth
                          margin="normal"
                          type="number"
                          inputProps={{ min: 0, max: 10 }}
                        />
                      </Grid>
                    ) : (
                      ""
                    )}
                    {sectionB > 0 && formData.marksB > 0 ? (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Section B"
                          name="marksChoiceB"
                          onChange={handleChange}
                          fullWidth
                          margin="normal"
                          type="number"
                          inputProps={{ min: 0, max: 10 }}
                        />
                      </Grid>
                    ) : (
                      ""
                    )}
                    {sectionC > 0 && formData.marksC > 0 ? (
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Section C"
                          name="marksChoiceC"
                          onChange={handleChange}
                          fullWidth
                          margin="normal"
                          type="number"
                          inputProps={{ min: 0, max: 10 }}
                        />
                      </Grid>
                    ) : (
                      ""
                    )}
                  </>
                ) : (
                  ""
                )}
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Right Section */}
        <Grid item xs={12} md={8}>
        <MathJax>
          <Paper sx={{ p: 3, backgroundColor: "#fff" }}>
            <div id="exam-paper">
              {/* Paper Heading */}
              <Box sx={{ padding: 3, borderBottom: "2px solid #000" }}>
                {/* Header Section with Exam Paper Look */}
                <Grid container spacing={2} alignItems="center">
                  {/* Logo Section */}

                  {/* Title Section */}
                  <Grid item xs>
                    <Grid
                      container
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      {/* Logo on the left */}
                      <Grid item xs={3} md={3}>
                        {imageSrc && (
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              overflow: "hidden",
                              borderRadius: "8px",
                              boxShadow: 1, // Adding a subtle shadow for emphasis
                            }}
                          >
                            <img
                              src={imageSrc}
                              alt="Logo"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                          </Box>
                        )}
                      </Grid>

                      {/* Heading on the right */}
                      <Grid item xs={9} md={9}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: "bold",
                            fontFamily: "serif",
                            textAlign: "center", // Align the heading to the right
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            marginRight: "30%", // Add some margin to the right
                          }}
                        >
                          {formData.heading
                            ? formData.heading
                            : "QUESTION PAPER"}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: "bold",
                        fontFamily: "serif",
                        textAlign: "center",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {/* Class {formData.grade} {formData.course} -{" "} */}
                      {formData.subHeading
                        ? formData.subHeading
                        : "MATHEMATICS (CLASS IX) PAPER I"}
                    </Typography>
                    <Grid
                      container
                      justifyContent="space-between"
                      sx={{ marginTop: 3 }}
                    >
                      <Grid item>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "serif",
                            textAlign: "left",
                            color: "text.secondary",
                          }}
                        >
                          Time: {formData.time}
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "serif",
                            textAlign: "right",
                            color: "text.secondary",
                          }}
                        >
                          Marks: {totalMarks}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>

              {sectionA > 0 ? (
                <>
                  <Box mt={3}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      className="text-center"
                      sx={{
                        fontWeight: "bold",
                        display: "flex",
                        justifyContent: "space-between", // Distribute space between the text and marks
                        alignItems: "center", // Vertically align the text and marks
                        width: "100%", // Ensure full width for proper alignment
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          textAlign: "center",
                          marginLeft: "10%",
                        }}
                      >
                        Section "A" (Objective)
                      </span>
                      <span>({marksA ? marksA : 0} Marks)</span>
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      <strong>Q1) </strong>Attempt{" "}
                      {formData.marksChoiceA > 0
                        ? `${"any " + (sectionA - formData.marksChoiceA)} `
                        : "all "}
                      questions from this Section. Each question carries{" "}
                      {formData.marksA} marks.
                    </Typography>
                  </Box>
                </>
              ) : (
                ""
              )}

              {matchedData &&
                matchedData &&
                matchedData.questions
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Sort by timestamp
                  .map((questionData, index) =>
                    typeof questionData.formData === "object" ? (
                      <>
                        {questionData &&
                          !questionData.error &&
                          questionData.type === "mcqs" && (
                            <Box mt={3}>
                              <Typography
                                variant="body2"
                                gutterBottom
                                sx={{
                                  fontWeight: "bold",
                                }}
                              >
                                Objective (Multiple Choice Questions)
                              </Typography>
                              <ol
                                style={{
                                  listStyleType: "none", // Remove default numbering
                                  paddingLeft: "22px", // Remove left padding
                                }}
                              >
                                {questionData.apiResponse.map((q, idx) => {
                                  // Declare the global variable and increment before returning the JSX
                                  const global = toRomanUrdu(globalA++);
                                  return (
                                    <li key={idx}>
                                      {/* {global}. {q.question} */}
                                      <li
                                      key={idx}
                                      style={{
                                        display: "flex",
                                      }}
                                    >
                                      <span>
                                        {global}.{"\u00A0"}
                                      </span>
                                      <span>{q.question}</span>
                                    </li>
                                      <ul
                                        style={{
                                          display: "flex",
                                          flexWrap: "wrap", // Allow wrapping of options
                                          paddingLeft: 0, // Remove left padding
                                          justifyContent: "flex-start", // Align items to the start
                                        }}
                                      >
                                        {q.options.map((option, i) => (
                                          <li
                                            key={i}
                                            style={{
                                              display: "flex",
                                              width: "calc(50% - 1rem)", // Take half the space minus margin
                                              marginTop: "0.2rem",
                                              marginBottom: "0.2rem",
                                              marginLeft: "0.5rem",
                                              marginRight: "0.5rem", // Keep the left and right spacing as is
                                              listStyleType: "none", // Remove list styling for options
                                              minWidth: "160px", // Ensure options do not get too narrow
                                              lineHeight: "1.2", // Reduced line height to minimize vertical spacing
                                            }}
                                          >
                                            <span className="d-block">
                                              {String.fromCharCode(97 + i)}.
                                              {"\u00A0"}
                                            </span>
                                            <span className="d-block">
                                              {/* 97 is the ASCII code for 'a' */}
                                              {option}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    </li>
                                  );
                                })}
                              </ol>
                            </Box>
                          )}
                      </>
                    ) : null
                  )}

              {/* 
{questionData.apiResponse.map((q, idx) => {
                                  // Declare the global variable and increment before returning the JSX
                                  const global = toRomanUrdu(globalB++);
                                  return (
                                    <li key={idx}>
                                      {global}. {q.question}
                                    </li>
                                  );
                                })} */}

              {matchedData &&
                matchedData &&
                matchedData.questions
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Sort by timestamp
                  .map((questionData, index) =>
                    typeof questionData.formData === "object" ? (
                      <>
                        {questionData &&
                          !questionData.error &&
                          questionData.type === "blanks" && (
                            <Box mt={3}>
                              <Typography
                                variant="body2"
                                gutterBottom
                                sx={{
                                  fontWeight: "bold",
                                }}
                              >
                                Objective (Fill in the Blanks)
                              </Typography>
                              <ol
                                style={{
                                  listStyleType: "none", // Remove default numbering
                                  paddingLeft: "22px", // Remove left padding
                                }}
                              >
                                {questionData.apiResponse.map((q, idx) => {
                                  // Declare the global variable and increment before returning the JSX
                                  const global = toRomanUrdu(globalA++);
                                  return (
                                    <li
                                      key={idx}
                                      style={{
                                        display: "flex",
                                      }}
                                    >
                                      <span>
                                        {global}.{"\u00A0"}
                                      </span>
                                      <span>{q.question}</span>
                                    </li>
                                  );
                                })}
                              </ol>
                            </Box>
                          )}
                      </>
                    ) : null
                  )}

              {sectionB > 0 ? (
                <>
                  <Box mt={3}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      className="text-center"
                      sx={{
                        fontWeight: "bold",
                        display: "flex",
                        justifyContent: "space-between", // Distribute space between the text and marks
                        alignItems: "center", // Vertically align the text and marks
                        width: "100%", // Ensure full width for proper alignment
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          textAlign: "center",
                          marginLeft: "10%",
                        }}
                      >
                        Section "B" (Short Answer Question)
                      </span>
                      <span>({marksB ? marksB : 0} Marks)</span>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Q2) </strong>Attempt{" "}
                      {formData.marksChoiceB > 0
                        ? `${"any " + (sectionB - formData.marksChoiceB)} `
                        : "all "}
                      questions from this Section. Each question carries{" "}
                      {formData.marksB} marks.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      {formData.sectionB && (
                        <>
                          <strong>Note: </strong>
                          {formData.sectionB}
                        </>
                      )}
                    </Typography>
                  </Box>
                </>
              ) : (
                ""
              )}

              {matchedData &&
                matchedData &&
                matchedData.questions
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Sort by timestamp
                  .map((questionData, index) =>
                    typeof questionData.formData === "object" ? (
                      <>
                        {/* Section B */}
                        {questionData &&
                          !questionData.error &&
                          questionData.type === "descriptive" && (
                            <Box>
                              <ol
                                style={{
                                  margin: 0,
                                  listStyleType: "none", // Remove default numbering
                                  paddingLeft: "22px", // Remove left padding
                                }}
                              >
                                {questionData.apiResponse.map((q, idx) => {
                                  // Declare the global variable and increment before returning the JSX
                                  const global = toRomanUrdu(globalB++);
                                  return (
                                    <li
                                      key={idx}
                                      style={{
                                        display: "flex",
                                      }}
                                    >
                                      <span>
                                        {global}.{"\u00A0"}
                                      </span>
                                      <span>{q.question}</span>
                                    </li>
                                  );
                                })}
                              </ol>
                            </Box>
                          )}
                      </>
                    ) : null
                  )}

              {matchedData &&
                matchedData &&
                matchedData.questions
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Sort by timestamp
                  .map((questionData, index) =>
                    typeof questionData.formData === "object" ? (
                      <>
                        {questionData &&
                          !questionData.error &&
                          questionData.type === "numerical" && (
                            <Box>
                              <ol
                                style={{
                                  margin: 0,
                                  listStyleType: "none",
                                  paddingLeft: "22px",
                                }}
                              >
                                {questionData.apiResponse.map((q, idx) => {
                                  const global = toRomanUrdu(globalB++);
                                  return (
                                    <li
                                      key={idx}
                                      style={{
                                        display: "flex",
                                      }}
                                    >
                                      <span>
                                        {global}.{"\u00A0"}
                                      </span>
                                      <span>{q.question}</span>
                                    </li>
                                  );
                                })}
                              </ol>
                            </Box>
                          )}
                      </>
                    ) : null
                  )}
              {matchedData &&
                matchedData &&
                matchedData.questions
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Sort by timestamp
                  .map((questionData, index) =>
                    typeof questionData.formData === "object" ? (
                      <>
                        {questionData &&
                          !questionData.error &&
                          questionData.type === "short" && (
                            <Box mt={3}>
                              <ol style={{ listStyleType: "lower-roman" }}>
                                {questionData.apiResponse.map((q, idx) => (
                                  <li key={idx}>{q.question}</li>
                                ))}
                              </ol>
                            </Box>
                          )}
                      </>
                    ) : null
                  )}
              {matchedData &&
                matchedData &&
                matchedData.questions
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) // Sort by timestamp
                  .map((questionData, index) =>
                    typeof questionData.formData === "object" ? (
                      <>
                        {/* Section C */}
                        {questionData &&
                          !questionData.error &&
                          questionData.type === "long" && (
                            <Box mt={3}>
                              <Typography
                                variant="h6"
                                gutterBottom
                                className="text-center"
                                sx={{
                                  fontWeight: "bold",
                                  display: "flex",
                                  justifyContent: "space-between", // Distribute space between the text and marks
                                  alignItems: "center", // Vertically align the text and marks
                                  width: "100%", // Ensure full width for proper alignment
                                }}
                              >
                                <span
                                  style={{
                                    flex: 1,
                                    textAlign: "center",
                                    marginLeft: "10%",
                                  }}
                                >
                                  Section "C" (Detailed Answer Questions)
                                </span>
                                <span>({marksC ? marksC : 0} Marks)</span>
                              </Typography>

                              <Typography variant="body2" gutterBottom>
                                <strong>Q3) </strong>Attempt{" "}
                                {formData.marksChoiceC > 0
                                  ? `${"any " + (sectionC - formData.marksChoiceC)} `
                                  : "all "}
                                questions from this Section. Each question
                                carries {formData.marksC} marks.
                              </Typography>
                              <Typography variant="body2" gutterBottom>
                                {formData.sectionC && (
                                  <>
                                    <strong>Note: </strong>
                                    {formData.sectionC}
                                  </>
                                )}
                              </Typography>
                              <ol style={{ listStyleType: "lower-roman" }}>
                                {questionData.apiResponse.map((q, idx) => (
                                  <li key={idx}>{q.question}</li>
                                ))}
                              </ol>
                            </Box>
                          )}
                      </>
                    ) : null
                  )}
            </div>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  onClick={downloadPDF}
                  variant="contained"
                  sx={{ mt: 3 }}
                  fullWidth
                >
                  Download PDF
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  onClick={downloadWordDocument}
                  variant="contained"
                  sx={{ mt: 3 }}
                  fullWidth
                  disabled
                >
                  Download Word
                </Button>
              </Grid>
            </Grid>
          </Paper>
          </MathJax>
        </Grid>
      </Grid>
    </Box>
  );
}
