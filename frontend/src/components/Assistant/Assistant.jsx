import React, { useEffect, useState } from "react";
import {
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Typography,
  Grid,
  Box,
  Checkbox,
  Select,
  FormControl,
  FormControlLabel,
  InputLabel,
  Alert,
} from "@mui/material";
import { handleApiRequest } from "../../hooks/generateSubmit";
import { useNavigate } from "react-router-dom";
import { formID } from "../../hooks/generateID";
import { getLocalTime } from "../../utils/time";
import {
  method,
  outputType,
  grades,
  courses,
  difficulty,
  years,
} from "../../utils/formData";
import MCQCards from "../Quiz/MCQCards";
import BlankCards from "../Quiz/BlankCards";
import QuestionAssistantCard from "../Question/QuestionAssistantCard";
export default function Assistant() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    method: "book",
    outputType: "",
    grade: "9",
    course: "",
    numberOfObjective: 0,
    numberOfMCQs: 0,
    numberOfBlanks: 0,
    numberOfShort: 0,
    numberOfDescriptive: 0,
    numberOfNumericals: 0,
    numberOfLong: 0,
    chapters: [],
    topics: [],
    years: [],
    difficulty: "easy",
    reference: true,
  });
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [contentMcqs, setContentMcqs] = useState([]);
  const [contentBlanks, setContentBlanks] = useState([]);
  const [contentDescriptive, setContentDescriptive] = useState([]);
  const [contentNumericals, setContentNumericals] = useState([]);
  const [contentLong, setContentLong] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateID, setGenerateID] = useState();
  const [objectiveAlert, setObjectiveAlert] = useState(false);
  const [shortAlert, setShortAlert] = useState(false);

  // useEffect(() => {

  //   const generateFormID = async () => {
  //     try {
  //       await formID({
  //         setGenerateID,
  //       });
  //       console.log("Generated ID:", generateID);
  //     } catch (error) {
  //       console.error("Error generating ID:", error);
  //     }
  //   };

  //   generateFormID(); // Call the async function
  // }, [setGenerateID,loading]);

  useEffect(() => {
    const fetchChapters = async () => {
      const payload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
      };

      try {
        const response = await fetch("http://127.0.0.1:8000/api/chapters", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!data.response) {
          throw new Error("Invalid response format from server");
        }
        const content = JSON.parse(data.response);

        if (!Array.isArray(content) || content.length === 0) {
          throw new Error(
            "No chapters were found. Please try again with different parameters."
          );
        }

        const formattedChapters = content.map((item) => ({
          value: item.chapter,
          label: item.chapter,
        }));

        setChapters(formattedChapters); // Set the formatted chapters
      } catch (err) {
        console.error("Error fetching chapters:", err);
        setError("Failed to load chapters. Please try again.");
      }
    };
    if (formData.course) {
      fetchChapters();
    }
  }, [formData.grade, formData.course]);

  useEffect(() => {
    const fetchTopics = async () => {
      const payload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        chapter: formData.chapters,
      };

      try {
        const response = await fetch("http://127.0.0.1:8000/api/topics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!data.response) {
          throw new Error("Invalid response format from server");
        }

        const content = JSON.parse(data.response);

        // Create formatted topics based on response
        const formattedTopics = Object.keys(content).map((chapter) => ({
          chapter: chapter, // Chapter name
          topics: content[chapter].map((topic, index) => ({
            value: topic.topic, // Topic name
            label: `${chapter}`, // Label showing chapter and topic number
          })),
        }));

        setTopics(formattedTopics);

        setFormData((prevFormData) => {
          const validTopics = prevFormData.topics.filter((selectedTopic) => {
            return formattedTopics.some((chapter) =>
              chapter.topics.some((topic) => topic.value === selectedTopic)
            );
          });

          // Return the updated form data with valid topics
          return {
            ...prevFormData,
            topics: validTopics,
          };
        });
      } catch (err) {
        console.error("Error fetching topics:", err);
        setError("Failed to load chapters. Please try again.");
      }
    };

    fetchTopics();
  }, [formData.chapters]); // Only fetch topics when the chapters change

  const handleBlur = (e) => {
    let { name, value } = e.target;

    // Check if the field that triggered the blur is one of the three specific fields
    if (
      name === "numberOfObjective" ||
      name === "numberOfMCQs" ||
      name === "numberOfBlanks"
    ) {
      const { numberOfObjective, numberOfMCQs, numberOfBlanks, outputType } =
        formData;
      // Check if the condition is met when the button loses focus
      if (numberOfObjective === 0) {
        setObjectiveAlert(false); // Set the alert state to true
      } else if (
        numberOfObjective !== numberOfMCQs + numberOfBlanks &&
        outputType === "generation"
      ) {
        setObjectiveAlert(true); // Set the alert state to true
      } else {
        setObjectiveAlert(false); // Clear the alert if the condition is met
      }
    }

    if (
      name === "numberOfShort" ||
      name === "numberOfDescriptive" ||
      name === "numberOfNumericals"
    ) {
      const { numberOfShort, numberOfDescriptive, numberOfNumericals } =
        formData;
      // Check if the condition is met when the button loses focus for 'numberOfShort'
      if (numberOfShort === 0) {
        setShortAlert(false); // Set the alert state to true for the short description
      } else if (numberOfShort !== numberOfDescriptive + numberOfNumericals) {
        setShortAlert(true); // Set the alert state to true
      } else {
        setShortAlert(false); // Clear the alert if the condition is met
      }
    }
  };
  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    setContentMcqs([]);
    setContentBlanks([]);
    setContentDescriptive([]);
    setContentNumericals([]);
    setContentLong([]);

    if (name === "outputType" && value === "retrieval") {
      setObjectiveAlert(false);
    }

    // If it's a checkbox, set the value to true/false based on `checked`
    if (name !== "years") {
      if (type === "checkbox") {
        value = checked;
      } else if (!isNaN(value) && Number.isInteger(parseInt(value, 10))) {
        value = parseInt(value, 10);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value, // Update state for checkboxes and other inputs
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission initiated");

    try {
      // Call the formID function to generate the ID
      await formID({ setGenerateID });
      console.log("Requested ID generation...");
    } catch (error) {
      console.error("Error generating ID:", error);
      return;
    }
  };

  // New useEffect hook to trigger the next steps after generateID updates
  useEffect(() => {
    if (generateID) {
      console.log("ID generated:", generateID);

      // Proceed with form submission logic here, using the updated generateID.
      submitFormWithID(generateID);
    }
  }, [generateID]);

  const submitFormWithID = async (id) => {
    const method = "assistant";
    if (!id) {
      console.error("No ID generated");
      return;
    }

    if (
      shortAlert ||
      objectiveAlert ||
      (formData.numberOfMCQs === 0 &&
        formData.numberOfBlanks === 0 &&
        formData.numberOfDescriptive === 0 &&
        formData.numberOfNumericals === 0 &&
        formData.numberOfLong === 0)
    ) {
      return;
    }

    const topicsWithChapters = topics.flatMap((chapterObj) =>
      chapterObj.topics
        .filter((topicObj) => formData.topics.includes(topicObj.value))
        .map((topicObj) => `${topicObj.value} from ${chapterObj.chapter}`)
    );

    // method: "book",
    // outputType: "",
    // grade: "9",
    // course: "",
    // numberOfObjective: 0,
    // numberOfMCQs: 0,
    // numberOfBlanks: 0,
    // numberOfShort: 0,
    // numberOfDescriptive: 0,
    // numberOfNumericals: 0,
    // numberOfLong: 0,
    // chapters: [],
    // topics: [],
    // difficulty: "easy",
    // reference: true,

    let mcqs = "";
    let mcqsPayload = "";

    let blanks = "";
    let blanksPayload = "";

    let descriptive = "";
    let descriptivePayload = "";

    let numerical = "";
    let numericalPayload = "";

    let long = "";
    let longPayload = "";

    if (formData.method === "book" && formData.outputType === "generation") {
      mcqsPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfMCQs, 10),
        difficulty: formData.difficulty,
        topic: topicsWithChapters,
      };

      blanksPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfBlanks, 10),
        difficulty: formData.difficulty,
        topic: topicsWithChapters,
      };

      descriptivePayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfDescriptive, 10),
        difficulty: formData.difficulty,
        topic: topicsWithChapters,
      };

      numericalPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfNumericals, 10),
        difficulty: formData.difficulty,
        topic: topicsWithChapters,
      };

      longPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfLong, 10),
        difficulty: formData.difficulty,
        topic: topicsWithChapters,
      };

      mcqs = "http://127.0.0.1:8000/api/objective/mcqs";
      blanks = "http://127.0.0.1:8000/api/objective/blanks";
      descriptive = "http://127.0.0.1:8000/api/short/descriptive";
      numerical = "http://127.0.0.1:8000/api/short/numerical";
      long = "http://127.0.0.1:8000/api/long/descriptive";
    } else if (
      formData.method === "book" &&
      formData.outputType === "retrieval"
    ) {
      mcqsPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfMCQs, 10),
        chapter: formData.chapters,
      };

      descriptivePayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfDescriptive, 10),
        topic: formData.topics,
        questionType: 0,
      };

      numericalPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfNumericals, 10),
        topic: formData.topics,
        questionType: 1,
      };

      longPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfLong, 10),
        difficulty: formData.difficulty,
        topic: topicsWithChapters,
      };

      mcqs = "http://127.0.0.1:8000/api/book/mcqs";
      blanks = "";
      descriptive = "http://127.0.0.1:8000/api/book/questions";
      numerical = "http://127.0.0.1:8000/api/book/questions";
      long = "http://127.0.0.1:8000/api/long/descriptive";
    } else if (
      formData.method === "paper" &&
      formData.outputType === "retrieval"
    ) {
      mcqsPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfMCQs, 10),
        years: formData.years,
      };

      descriptivePayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        type: "Short",
        quantity: parseInt(formData.numberOfDescriptive, 10),
        chapter: formData.chapters,
        years: formData.years,
      };

      numericalPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        type: "Numerical",
        quantity: parseInt(formData.numberOfNumericals, 10),
        chapter: formData.chapters,
        years: formData.years,
      };

      longPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        type: "Long",
        quantity: parseInt(formData.numberOfLong, 10),
        chapter: formData.chapters,
        years: formData.years,
      };

      mcqs = "http://127.0.0.1:8000/api/paper/paperMcq";
      blanks = "";
      descriptive = "http://127.0.0.1:8000/api/getPaper";
      numerical = "http://127.0.0.1:8000/api/getPaper";
      long = "http://127.0.0.1:8000/api/getPaper";
    }

    if (formData.outputType === "retrieval") {
      if (formData.numberOfMCQs > 0 && mcqs !== "") {
        await handleApiRequest({
          link: mcqs,
          payload: mcqsPayload,
          formData,
          setError,
          setContent: setContentMcqs,
          setLoading,
          generateID,
          type: "mcqs",
          method,
        });
      }
    } else {
      if (
        formData.numberOfMCQs > 0 &&
        formData.numberOfObjective > 0 &&
        mcqs !== ""
      ) {
        await handleApiRequest({
          link: mcqs,
          payload: mcqsPayload,
          formData,
          setError,
          setContent: setContentMcqs,
          setLoading,
          generateID,
          type: "mcqs",
          method,
        });
      }
    }

    if (
      formData.numberOfBlanks > 0 &&
      formData.numberOfObjective > 0 &&
      blanks !== ""
    ) {
      await handleApiRequest({
        link: blanks,
        payload: blanksPayload,
        formData,
        setError,
        setContent: setContentBlanks,
        setLoading,
        generateID,
        type: "blanks",
        method,
      });
    }

    if (
      formData.numberOfDescriptive > 0 &&
      formData.numberOfShort > 0 &&
      descriptive !== ""
    ) {
      await handleApiRequest({
        link: descriptive,
        payload: descriptivePayload,
        formData,
        setError,
        setContent: setContentDescriptive,
        setLoading,
        generateID,
        type: "descriptive",
        method,
      });
    }

    if (
      formData.numberOfNumericals > 0 &&
      formData.numberOfShort > 0 &&
      numerical !== ""
    ) {
      await handleApiRequest({
        link: numerical,
        payload: numericalPayload,
        formData,
        setError,
        setContent: setContentNumericals,
        setLoading,
        generateID,
        type: "numerical",
        method,
      });
    }

    if (formData.numberOfLong > 0 && long !== "") {
      await handleApiRequest({
        link: long,
        payload: longPayload,
        formData,
        setError,
        setContent: setContentLong,
        setLoading,
        generateID,
        type: "long",
        method,
      });
    }
  };

  // const handleSubmit = async (e) => {
  //   console.log("aya")
  //   const method = "assistant";
  //   e.preventDefault();

  //   try {
  //     // Call the formID function to generate the ID
  //     await formID({ setGenerateID });

  //     // Wait for the `generateID` state to update
  //     const waitForID = () =>
  //       new Promise((resolve) => {
  //         const interval = setInterval(() => {
  //           if (generateID !== undefined) {
  //             clearInterval(interval);
  //             resolve(generateID);
  //           }
  //         }, 50); // Check every 50ms
  //       });

  //     const id = await waitForID();

  //     if (!id) {
  //       console.log("Failed to generate ID.");
  //       return;
  //     }
  //   } catch (error) {
  //     console.log("Error during submission:", error);
  //   }

  //   if (
  //     shortAlert ||
  //     objectiveAlert ||
  //     (formData.numberOfMCQs === 0 &&
  //       formData.numberOfBlanks === 0 &&
  //       formData.numberOfDescriptive === 0 &&
  //       formData.numberOfNumericals === 0 &&
  //       formData.numberOfLong === 0)
  //   ) {
  //     return;
  //   }

  //   const topicsWithChapters = topics.flatMap((chapterObj) =>
  //     chapterObj.topics
  //       .filter((topicObj) => formData.topics.includes(topicObj.value))
  //       .map((topicObj) => `${topicObj.value} from ${chapterObj.chapter}`)
  //   );

  //   // method: "book",
  //   // outputType: "",
  //   // grade: "9",
  //   // course: "",
  //   // numberOfObjective: 0,
  //   // numberOfMCQs: 0,
  //   // numberOfBlanks: 0,
  //   // numberOfShort: 0,
  //   // numberOfDescriptive: 0,
  //   // numberOfNumericals: 0,
  //   // numberOfLong: 0,
  //   // chapters: [],
  //   // topics: [],
  //   // difficulty: "easy",
  //   // reference: true,

  //   let mcqs = "";
  //   let mcqsPayload = "";

  //   let blanks = "";
  //   let blanksPayload = "";

  //   let descriptive = "";
  //   let descriptivePayload = "";

  //   let numerical = "";
  //   let numericalPayload = "";

  //   let long = "";
  //   let longPayload = "";

  //   if (formData.method === "book" && formData.outputType === "generation") {
  //     mcqsPayload = {
  //       grade: parseInt(formData.grade, 10),
  //       course: formData.course,
  //       quantity: parseInt(formData.numberOfMCQs, 10),
  //       difficulty: formData.difficulty,
  //       topic: topicsWithChapters,
  //     };

  //     blanksPayload = {
  //       grade: parseInt(formData.grade, 10),
  //       course: formData.course,
  //       quantity: parseInt(formData.numberOfBlanks, 10),
  //       difficulty: formData.difficulty,
  //       topic: topicsWithChapters,
  //     };

  //     descriptivePayload = {
  //       grade: parseInt(formData.grade, 10),
  //       course: formData.course,
  //       quantity: parseInt(formData.numberOfDescriptive, 10),
  //       difficulty: formData.difficulty,
  //       topic: topicsWithChapters,
  //     };

  //     numericalPayload = {
  //       grade: parseInt(formData.grade, 10),
  //       course: formData.course,
  //       quantity: parseInt(formData.numberOfNumericals, 10),
  //       difficulty: formData.difficulty,
  //       topic: topicsWithChapters,
  //     };

  //     longPayload = {
  //       grade: parseInt(formData.grade, 10),
  //       course: formData.course,
  //       quantity: parseInt(formData.numberOfLong, 10),
  //       difficulty: formData.difficulty,
  //       topic: topicsWithChapters,
  //     };

  //     mcqs = "http://127.0.0.1:8000/api/objective/mcqs";
  //     blanks = "http://127.0.0.1:8000/api/objective/blanks";
  //     descriptive = "http://127.0.0.1:8000/api/short/descriptive";
  //     numerical = "http://127.0.0.1:8000/api/short/numerical";
  //     long = "http://127.0.0.1:8000/api/long/descriptive";
  //   } else if (
  //     formData.method === "book" &&
  //     formData.outputType === "retrieval"
  //   ) {
  //     mcqsPayload = {
  //       // grade: parseInt(formData.grade, 10),
  //       // course: formData.course,
  //       quantity: parseInt(formData.numberOfMCQs, 10),
  //       chapter: formData.chapters,
  //     };

  //     descriptivePayload = {
  //       // grade: parseInt(formData.grade, 10),
  //       // course: formData.course,
  //       quantity: parseInt(formData.numberOfDescriptive, 10),
  //       topic: formData.topics,
  //       questionType: 0,
  //     };

  //     numericalPayload = {
  //       // grade: parseInt(formData.grade, 10),
  //       // course: formData.course,
  //       quantity: parseInt(formData.numberOfNumericals, 10),
  //       topic: formData.topics,
  //       questionType: 1,
  //     };

  //     longPayload = {
  //       grade: parseInt(formData.grade, 10),
  //       course: formData.course,
  //       quantity: parseInt(formData.numberOfLong, 10),
  //       difficulty: formData.difficulty,
  //       topic: topicsWithChapters,
  //     };

  //     mcqs = "http://127.0.0.1:8000/api/book/mcqs";
  //     blanks = "";
  //     descriptive = "http://127.0.0.1:8000/api/book/questions";
  //     numerical = "http://127.0.0.1:8000/api/book/questions";
  //     long = "http://127.0.0.1:8000/api/long/descriptive";
  //   } else if (
  //     formData.method === "paper" &&
  //     formData.outputType === "retrieval"
  //   ) {
  //     mcqsPayload = {
  //       // grade: parseInt(formData.grade, 10),
  //       // course: formData.course,
  //       quantity: parseInt(formData.numberOfMCQs, 10),
  //       years: formData.years,
  //     };

  //     descriptivePayload = {
  //       // grade: parseInt(formData.grade, 10),
  //       // course: formData.course,
  //       type: "Short",
  //       quantity: parseInt(formData.numberOfDescriptive, 10),
  //       chapter: formData.chapters,
  //       years: formData.years,
  //     };

  //     numericalPayload = {
  //       // grade: parseInt(formData.grade, 10),
  //       // course: formData.course,
  //       type: "Numerical",
  //       quantity: parseInt(formData.numberOfNumericals, 10),
  //       chapter: formData.chapters,
  //       years: formData.years,
  //     };

  //     longPayload = {
  //       // grade: parseInt(formData.grade, 10),
  //       // course: formData.course,
  //       type: "Long",
  //       quantity: parseInt(formData.numberOfLong, 10),
  //       chapter: formData.chapters,
  //       years: formData.years,
  //     };

  //     mcqs = "http://127.0.0.1:8000/api/paper/paperMcq";
  //     blanks = "";
  //     descriptive = "http://127.0.0.1:8000/api/getPaper";
  //     numerical = "http://127.0.0.1:8000/api/getPaper";
  //     long = "http://127.0.0.1:8000/api/getPaper";
  //   }

  //   if (formData.outputType === "retrieval") {
  //     if (formData.numberOfMCQs > 0 && mcqs !== "") {
  //       await handleApiRequest({
  //         link: mcqs,
  //         payload: mcqsPayload,
  //         formData,
  //         setError,
  //         setContent: setContentMcqs,
  //         setLoading,
  //         generateID,
  //         type: "mcqs",
  //         method,
  //       });
  //     }
  //   } else {
  //     if (
  //       formData.numberOfMCQs > 0 &&
  //       formData.numberOfObjective > 0 &&
  //       mcqs !== ""
  //     ) {
  //       await handleApiRequest({
  //         link: mcqs,
  //         payload: mcqsPayload,
  //         formData,
  //         setError,
  //         setContent: setContentMcqs,
  //         setLoading,
  //         generateID,
  //         type: "mcqs",
  //         method,
  //       });
  //     }
  //   }

  //   if (
  //     formData.numberOfBlanks > 0 &&
  //     formData.numberOfObjective > 0 &&
  //     blanks !== ""
  //   ) {
  //     await handleApiRequest({
  //       link: blanks,
  //       payload: blanksPayload,
  //       formData,
  //       setError,
  //       setContent: setContentBlanks,
  //       setLoading,
  //       generateID,
  //       type: "blanks",
  //       method,
  //     });
  //   }

  //   if (
  //     formData.numberOfDescriptive > 0 &&
  //     formData.numberOfShort > 0 &&
  //     descriptive !== ""
  //   ) {
  //     await handleApiRequest({
  //       link: descriptive,
  //       payload: descriptivePayload,
  //       formData,
  //       setError,
  //       setContent: setContentDescriptive,
  //       setLoading,
  //       generateID,
  //       type: "descriptive",
  //       method,
  //     });
  //   }

  //   if (
  //     formData.numberOfNumericals > 0 &&
  //     formData.numberOfShort > 0 &&
  //     numerical !== ""
  //   ) {
  //     await handleApiRequest({
  //       link: numerical,
  //       payload: numericalPayload,
  //       formData,
  //       setError,
  //       setContent: setContentNumericals,
  //       setLoading,
  //       generateID,
  //       type: "numerical",
  //       method,
  //     });
  //   }

  //   if (formData.numberOfLong > 0 && long !== "") {
  //     await handleApiRequest({
  //       link: long,
  //       payload: longPayload,
  //       formData,
  //       setError,
  //       setContent: setContentLong,
  //       setLoading,
  //       generateID,
  //       type: "long",
  //       method,
  //     });
  //   }
  // };

  const handleExport = () => {
    // Ensure generateID exists before navigating
    if (!generateID) {
      console.error("generateID is undefined. Cannot navigate.");
      return;
    }

    console.log("Navigating to export with generateID:", generateID);
    navigate("/export", { state: { generateID } });
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
            <Typography variant="h4" gutterBottom className="text-center">
              Paper
            </Typography>
            <form onSubmit={handleSubmit}>
              {/* <form> */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    name="method"
                    select
                    label="Paper From"
                    value={formData.method}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {method.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    name="outputType"
                    select
                    label="Method"
                    value={formData.outputType}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {outputType
                      .filter(
                        (option) =>
                          formData.method === "book" ||
                          option.label.toLowerCase() !== "generation"
                      ) // Conditionally filter options
                      .map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                  </TextField>
                </Grid>
                {formData.outputType !== "" ? (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="grade"
                        select
                        label="Grade"
                        value={formData.grade}
                        onChange={handleChange}
                        disabled={loading}
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
                        disabled={loading}
                      >
                        {courses.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </>
                ) : (
                  ""
                )}
                {formData.course ? (
                  <Grid item xs={12} md={12}>
                    <FormControl fullWidth>
                      <InputLabel id="chapter-label">Chapters</InputLabel>{" "}
                      <Select
                        fullWidth
                        multiple
                        value={formData.chapters} // Ensure 'chapters' array is used
                        onChange={handleChange}
                        name="chapters" // Use the correct form field name
                        renderValue={(selected) => selected.join(", ")} // Display selected chapters
                        disabled={loading}
                      >
                        {chapters.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Checkbox
                              checked={formData.chapters.includes(option.value)} // Check if the chapter is selected
                            />
                            {option.label} {/* Display the chapter name */}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                ) : (
                  ""
                )}
                {formData.chapters.length !== 0 ? (
                  formData.method !== "paper" ? (
                    <>
                      <Grid item xs={12} md={12}>
                        <FormControl fullWidth>
                          <InputLabel id="topic-label">Topics</InputLabel>
                          <Select
                            labelId="topic-label"
                            fullWidth
                            multiple
                            value={formData.topics}
                            onChange={handleChange}
                            name="topics"
                            renderValue={(selected) => selected.join(", ")}
                            disabled={loading}
                          >
                            {topics && topics.length > 0 ? (
                              topics.map((chapter) => [
                                <MenuItem
                                  key={`${chapter.chapter}-disabled`}
                                  disabled
                                >
                                  {chapter.chapter}{" "}
                                </MenuItem>,
                                chapter.topics && chapter.topics.length > 0 ? (
                                  chapter.topics.map((topic, index) => (
                                    <MenuItem
                                      key={topic.value}
                                      value={topic.value}
                                    >
                                      <Checkbox
                                        checked={formData.topics.includes(
                                          topic.value
                                        )}
                                      />
                                      {topic.value} ({index + 1}){" "}
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem disabled>
                                    No topics available
                                  </MenuItem>
                                ),
                              ])
                            ) : (
                              <MenuItem disabled>
                                No chapters available
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>
                      </Grid>
                    </>
                  ) : (
                    <Grid item xs={12} md={12}>
                      <FormControl fullWidth>
                        <InputLabel id="year-label">Years</InputLabel>{" "}
                        <Select
                          fullWidth
                          multiple
                          value={formData.years}
                          onChange={handleChange}
                          name="years"
                          renderValue={(selected) => selected.join(", ")}
                          disabled={loading}
                        >
                          {years.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              <Checkbox
                                checked={formData.years.includes(option.value)}
                              />
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )
                ) : (
                  ""
                )}
                {formData.topics.length !== 0 ||
                (formData.method === "paper" &&
                  formData.chapters.length !== 0) ? (
                  <>
                    <Grid item xs={12} md={12}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        className="text-center"
                      >
                        Paper Pattern
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Objective Questions
                      </Typography>
                    </Grid>
                    {formData.outputType === "generation" ? (
                      <>
                        <Grid item xs={12} md={12}>
                          <TextField
                            fullWidth
                            name="numberOfObjective"
                            label="Number of Objective"
                            type="number"
                            onBlur={handleBlur}
                            value={formData.numberOfObjective}
                            onChange={handleChange}
                            inputProps={{ min: 0, max: 10 }}
                            disabled={loading}
                          />
                        </Grid>
                        {formData.numberOfObjective !== 0 ? (
                          <>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                name="numberOfMCQs"
                                label="Number of MCQs"
                                type="number"
                                onBlur={handleBlur}
                                value={formData.numberOfMCQs}
                                onChange={handleChange}
                                inputProps={{ min: 0, max: 10 }}
                                disabled={loading}
                              />
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                name="numberOfBlanks"
                                label="Number of Blanks"
                                type="number"
                                onBlur={handleBlur}
                                value={formData.numberOfBlanks}
                                onChange={handleChange}
                                inputProps={{ min: 0, max: 10 }}
                                disabled={loading}
                              />
                            </Grid>
                          </>
                        ) : (
                          ""
                        )}
                      </>
                    ) : (
                      <>
                        <Grid item xs={12} md={12}>
                          <TextField
                            fullWidth
                            name="numberOfMCQs"
                            label="Number of MCQs"
                            type="number"
                            onBlur={handleBlur}
                            value={formData.numberOfMCQs}
                            onChange={handleChange}
                            inputProps={{ min: 0, max: 10 }}
                            disabled={loading}
                          />
                        </Grid>
                      </>
                    )}
                    {objectiveAlert ? (
                      <Grid item xs={12} md={12}>
                        <Alert severity="warning">
                          The number of Objectives must be equal to the sum of
                          MCQs and Blanks.
                        </Alert>
                      </Grid>
                    ) : (
                      ""
                    )}

                    <Grid item xs={12} md={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Short Questions
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={12}>
                      <TextField
                        fullWidth
                        name="numberOfShort"
                        label="Number of Short"
                        type="number"
                        onBlur={handleBlur}
                        value={formData.numberOfShort}
                        onChange={handleChange}
                        inputProps={{ min: 0, max: 10 }}
                        disabled={loading}
                      />
                    </Grid>
                    {formData.numberOfShort !== 0 ? (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            name="numberOfDescriptive"
                            label="Number of Descriptive(Short)"
                            type="number"
                            onBlur={handleBlur}
                            value={formData.numberOfDescriptive}
                            onChange={handleChange}
                            inputProps={{ min: 0, max: 10 }}
                            disabled={loading}
                          />
                        </Grid>
                        {formData.course!=="Mathematics" && (
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            name="numberOfNumericals"
                            label="Number of Numericals(Short)"
                            type="number"
                            onBlur={handleBlur}
                            value={formData.numberOfNumericals}
                            onChange={handleChange}
                            inputProps={{ min: 0, max: 10 }}
                            disabled={loading}
                          />
                        </Grid>
                        )}
                      </>
                    ) : (
                      ""
                    )}
                    {shortAlert ? (
                      <Grid item xs={12} md={12}>
                        <Alert severity="warning">
                          The number of Short Questions must be equal to the sum
                          of Descriptive and Numericals.
                        </Alert>
                      </Grid>
                    ) : (
                      ""
                    )}
                    <Grid item xs={12} md={12}>
                      <Typography variant="subtitle1" gutterBottom>
                        Long Questions
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={12}>
                      <TextField
                        fullWidth
                        name="numberOfLong"
                        label="Number of Long"
                        type="number"
                        onBlur={handleBlur}
                        value={formData.numberOfLong}
                        onChange={handleChange}
                        inputProps={{ min: 0, max: 10 }}
                        disabled={loading}
                      />
                    </Grid>
                    {formData.outputType !== "retrieval" ||
                    formData.method !== "paper" ? (
                      <Grid item xs={12} md={12}>
                        <TextField
                          fullWidth
                          name="difficulty"
                          select
                          label="Difficulty"
                          value={formData.difficulty}
                          onChange={handleChange}
                          disabled={loading}
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

                    <Grid item xs={12} md={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.reference} // Control the checkbox state with formData.reference
                            onChange={handleChange} // Use your existing handleChange function
                            name="reference" // Ensure name matches the state property (formData.reference)
                            disabled={loading}
                          />
                        }
                        label="Question Reference"
                      />
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
                  </>
                ) : (
                  ""
                )}

                <Grid item xs={12} md={12}>
                  <Typography color="info" className="py-3">
                    <b>Note:</b> Questions are generated Randomly considering
                    all topics of equal weightage depending upon the quantity
                    provided.
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
            Generated Paper
          </Typography>
          {formData.numberOfMCQs !== 0 &&
          (formData.numberOfObjective !== 0 ||
            formData.outputType !== "generation") &&
          objectiveAlert === false ? (
            <>
              {" "}
              <Typography className="mt-4" variant="h5" gutterBottom>
                Section A (MCQS)
              </Typography>
              <MCQCards content={contentMcqs} reference={formData.reference} />
            </>
          ) : (
            ""
          )}
          {formData.numberOfBlanks !== 0 &&
          formData.numberOfObjective &&
          formData.outputType === "generation" &&
          objectiveAlert === false ? (
            <>
              {" "}
              <Typography className="mt-4" variant="h5" gutterBottom>
                Section A (Blanks)
              </Typography>
              <BlankCards
                content={contentBlanks}
                reference={formData.reference}
              />
            </>
          ) : (
            ""
          )}
          {formData.numberOfDescriptive !== 0 &&
          formData.numberOfShort &&
          shortAlert === false ? (
            <>
              {" "}
              <Typography className="mt-4" variant="h5" gutterBottom>
                Section B (Descriptive)
              </Typography>
              <QuestionAssistantCard
                grade={formData.grade}
                course={formData.course}
                content={contentDescriptive}
                questionType="descriptive"
                reference={formData.reference}
                generateID={generateID}
                type="descriptive"
                method="assistant"
              />
            </>
          ) : (
            ""
          )}
          {formData.numberOfNumericals !== 0 &&
          formData.numberOfShort &&
          shortAlert === false ? (
            <>
              {" "}
              <Typography className="mt-4" variant="h5" gutterBottom>
                Section B (Numericals)
              </Typography>
              <QuestionAssistantCard
                grade={formData.grade}
                course={formData.course}
                content={contentNumericals}
                questionType="numerical"
                reference={formData.reference}
                generateID={generateID}
                type="numerical"
                method="assistant"
              />
            </>
          ) : (
            ""
          )}
          {formData.numberOfLong !== 0 ? (
            <>
              {" "}
              <Typography className="mt-4" variant="h5" gutterBottom>
                Section C (Long)
              </Typography>
              <QuestionAssistantCard
                grade={formData.grade}
                course={formData.course}
                content={contentLong}
                questionType="long"
                reference={formData.reference}
                generateID={generateID}
                type="long"
                method="assistant"
              />
            </>
          ) : (
            ""
          )}
          {contentMcqs.length > 0 ||
          contentBlanks.length > 0 ||
          contentDescriptive.length > 0 ||
          contentNumericals.length > 0 ||
          contentLong.length > 0 ? (
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{ py: 1.5 }}
                disabled={loading}
                onClick={handleExport}
              >
                {loading ? <CircularProgress size={24} /> : "Export"}
              </Button>
            </Grid>
          ) : (
            ""
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
