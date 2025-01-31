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
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Container,
} from "@mui/material";
import { handleApiRequest } from "../../hooks/generateSubmit";
import { useNavigate } from "react-router-dom";
import { formID } from "../../hooks/generateID";
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

const steps = ["Basic Info", "Select Content", "Question Pattern"];
export default function Assistant() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    method: "",
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

  const getActiveStep = () => {
    if (
      !formData.method ||
      !formData.outputType ||
      !formData.grade ||
      !formData.course
    ) {
      return 0; // Basic Info step
    }

    if (formData.method === "book" && formData.outputType === "generation") {
      if (!formData.chapters.length || !formData.topics.length) {
        return 1; // Content Selection step
      }
    } else if (
      formData.method === "paper" &&
      formData.outputType === "retrieval"
    ) {
      if (!formData.chapters.length || !formData.years.length) {
        return 1; // Content Selection step
      }
    } else if (
      formData.method === "book" &&
      formData.outputType === "retrieval"
    ) {
      if (!formData.chapters.length) {
        return 1; // Content Selection step
      }
    }
    return 2; // Question Pattern step
  };

  useEffect(() => {
    const fetchChapters = async () => {
      const payload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
      };

      try {
        const response = await fetch("https://ai.myedbox.com/api/chapters", {
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
        const response = await fetch("https://ai.myedbox.com/api/topics", {
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

      mcqs = "https://ai.myedbox.com/api/objective/mcqs";
      blanks = "https://ai.myedbox.com/api/objective/blanks";
      descriptive = "https://ai.myedbox.com/api/short/descriptive";
      numerical = "https://ai.myedbox.com/api/short/numerical";
      long = "https://ai.myedbox.com/api/long/descriptive";
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
        section: "B",
        chapter: formData.chapters,
        questionType: 0,
      };

      numericalPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfNumericals, 10),
        section: "B",
        chapter: formData.chapters,
        questionType: 1,
      };

      longPayload = {
        grade: parseInt(formData.grade, 10),
        course: formData.course,
        quantity: parseInt(formData.numberOfLong, 10),
        section: "C",
        chapter: formData.chapters,
        questionType: 0,
      };

      mcqs = "https://ai.myedbox.com/api/book/mcqs";
      blanks = "";
      descriptive = "https://ai.myedbox.com/api/book/questions";
      numerical = "https://ai.myedbox.com/api/book/questions";
      long = "https://ai.myedbox.com/api/book/questions";
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

      mcqs = "https://ai.myedbox.com/api/paper/paperMcq";
      blanks = "";
      descriptive = "https://ai.myedbox.com/api/getPaper";
      numerical = "https://ai.myedbox.com/api/getPaper";
      long = "https://ai.myedbox.com/api/getPaper";
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

  //     mcqs = "https://ai.myedbox.com/api/objective/mcqs";
  //     blanks = "https://ai.myedbox.com/api/objective/blanks";
  //     descriptive = "https://ai.myedbox.com/api/short/descriptive";
  //     numerical = "https://ai.myedbox.com/api/short/numerical";
  //     long = "https://ai.myedbox.com/api/long/descriptive";
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

  //     mcqs = "https://ai.myedbox.com/api/book/mcqs";
  //     blanks = "";
  //     descriptive = "https://ai.myedbox.com/api/book/questions";
  //     numerical = "https://ai.myedbox.com/api/book/questions";
  //     long = "https://ai.myedbox.com/api/long/descriptive";
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

  //     mcqs = "https://ai.myedbox.com/api/paper/paperMcq";
  //     blanks = "";
  //     descriptive = "https://ai.myedbox.com/api/getPaper";
  //     numerical = "https://ai.myedbox.com/api/getPaper";
  //     long = "https://ai.myedbox.com/api/getPaper";
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
    <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Form Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              <Typography
                variant="h4"
                gutterBottom
                align="center"
                color="primary"
                sx={{ mb: 4 }}
              >
                Paper Generator
              </Typography>

              <Stepper activeStep={getActiveStep()} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Basic Info Section */}
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ mb: 3 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="primary">
                          Basic Information
                        </Typography>
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
                                <MenuItem
                                  key={option.value}
                                  value={option.value}
                                >
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
                                  <MenuItem
                                    key={option.value}
                                    value={option.value}
                                  >
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
                                    <MenuItem
                                      key={option.value}
                                      value={option.value}
                                    >
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
                                    <MenuItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                            </>
                          ) : (
                            ""
                          )}

                          {/* ... (similar styled fields for outputType, grade, course) */}
                        </Grid>
                      </CardContent>
                    </Card>

                    {/* Content Selection Section */}
                    {formData.course && (
                      <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            Content Selection
                          </Typography>
                          {/* ... (chapters and topics selection with similar styling) */}
                          {formData.course ? (
                            <Grid item xs={12} md={12}>
                              <FormControl fullWidth>
                                <InputLabel id="chapter-label">
                                  Chapters
                                </InputLabel>{" "}
                                <Select
                                  fullWidth
                                  multiple
                                  value={formData.chapters} // Ensure 'chapters' array is used
                                  onChange={handleChange}
                                  name="chapters" // Use the correct form field name
                                  renderValue={(selected) =>
                                    selected.join(", ")
                                  } // Display selected chapters
                                  disabled={loading}
                                >
                                  {chapters.map((option) => (
                                    <MenuItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      <Checkbox
                                        checked={formData.chapters.includes(
                                          option.value
                                        )} // Check if the chapter is selected
                                      />
                                      {option.label}{" "}
                                      {/* Display the chapter name */}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                          ) : (
                            ""
                          )}
                          {formData.chapters.length !== 0 ? (
                            formData.method === "book" &&
                            formData.outputType === "generation" ? (
                              <>
                                <Grid item xs={12} md={12} sx={{ mt: 3 }}>
                                  <FormControl fullWidth>
                                    <InputLabel id="topic-label">
                                      Topics
                                    </InputLabel>
                                    <Select
                                      labelId="topic-label"
                                      fullWidth
                                      multiple
                                      value={formData.topics}
                                      onChange={handleChange}
                                      name="topics"
                                      renderValue={(selected) =>
                                        selected.join(", ")
                                      }
                                      disabled={loading}
                                    >
                                      {topics && topics.length > 0 ? (
                                        topics.map((chapter) => [
                                          <MenuItem
                                            key={`${chapter.chapter}-disabled`}
                                            disabled
                                          >
                                            {chapter.chapter}
                                          </MenuItem>,
                                          chapter.topics &&
                                          chapter.topics.length > 0 ? (
                                            chapter.topics.map(
                                              (topic, index) => (
                                                <MenuItem
                                                  key={topic.value}
                                                  value={topic.value}
                                                >
                                                  <Checkbox
                                                    checked={formData.topics.includes(
                                                      topic.value
                                                    )}
                                                  />
                                                  {topic.value} ({index + 1})
                                                </MenuItem>
                                              )
                                            )
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
                            ) : formData.method === "paper" &&
                              formData.outputType === "retrieval" ? (
                              <Grid item xs={12} md={12} sx={{ mt: 3 }}>
                                <FormControl fullWidth>
                                  <InputLabel id="year-label">Years</InputLabel>
                                  <Select
                                    fullWidth
                                    multiple
                                    value={formData.years}
                                    onChange={handleChange}
                                    name="years"
                                    renderValue={(selected) =>
                                      selected.join(", ")
                                    }
                                    disabled={loading}
                                  >
                                    {years.map((option) => (
                                      <MenuItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        <Checkbox
                                          checked={formData.years.includes(
                                            option.value
                                          )}
                                        />
                                        {option.label}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                            ) : null
                          ) : null}
                        </CardContent>
                      </Card>
                    )}

                    {/* Question Pattern Section */}
                    {(formData.topics.length !== 0 ||
                      formData.years.length !== 0 ||
                      (formData.method === "book" &&
                        formData.outputType === "retrieval" &&
                        formData.chapters.length !== 0)) && (
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom color="primary">
                            Question Pattern
                          </Typography>

                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle1"
                              color="primary"
                              gutterBottom
                            >
                              Objective Questions
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
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
                                {formData.numberOfObjective !== 0 && (
                                  <Grid container spacing={2} sx={{ mt: 3 }}>
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
                                  </Grid>
                                )}
                              </>
                            ) : (
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
                            )}
                            {objectiveAlert && (
                              <Grid item xs={12} md={12}>
                                <Alert severity="warning">
                                  The number of Objectives must be equal to the
                                  sum of MCQs and Blanks.
                                </Alert>
                              </Grid>
                            )}
                          </Box>

                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle1"
                              color="primary"
                              gutterBottom
                            >
                              Short Questions
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
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
                              <Grid container spacing={2} sx={{ mt: 3 }}>
                                <Grid item xs={12} md={6}>
                                  <TextField
                                    fullWidth
                                    name="numberOfDescriptive"
                                    label="Number of Descriptive (Short)"
                                    type="number"
                                    onBlur={handleBlur}
                                    value={formData.numberOfDescriptive}
                                    onChange={handleChange}
                                    inputProps={{ min: 0, max: 10 }}
                                    disabled={loading}
                                  />
                                </Grid>
                                {formData.course !== "Mathematics" && (
                                  <Grid item xs={12} md={6}>
                                    <TextField
                                      fullWidth
                                      name="numberOfNumericals"
                                      label="Number of Numericals (Short)"
                                      type="number"
                                      onBlur={handleBlur}
                                      value={formData.numberOfNumericals}
                                      onChange={handleChange}
                                      inputProps={{ min: 0, max: 10 }}
                                      disabled={loading}
                                    />
                                  </Grid>
                                )}
                              </Grid>
                            ) : null}
                            {shortAlert && (
                              <Grid item xs={12} md={12}>
                                <Alert severity="warning">
                                  The number of Short Questions must be equal to
                                  the sum of Descriptive and Numericals.
                                </Alert>
                              </Grid>
                            )}
                          </Box>

                          <Box sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle1"
                              color="primary"
                              gutterBottom
                            >
                              Long Questions
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
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
                            {formData.outputType === "generation" &&
                            formData.method === "book" ? (
                              <Grid item xs={12} md={12} sx={{ mt: 3 }}>
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
                                    <MenuItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </Grid>
                            ) : (
                              ""
                            )}
                            <Grid item xs={12} md={12} sx={{ mt: 3 }}>
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
                            {/* ... (long questions fields) */}
                          </Box>
                        </CardContent>
                      </Card>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      size="large"
                      sx={{ mt: 3, py: 1.5 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Generate Paper"
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h4" gutterBottom color="primary">
                Generated Paper
              </Typography>

              {/* MCQs Section */}
              {contentMcqs.length > 0 && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h5" color="primary" gutterBottom>
                      Section A (MCQs)
                    </Typography>
                    <MCQCards
                      content={contentMcqs}
                      reference={formData.reference}
                    />
                  </CardContent>
                </Card>
              )}

              {contentBlanks.length > 0 && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h5" color="primary" gutterBottom>
                      Section A (Blanks)
                    </Typography>
                    <BlankCards
                      content={contentBlanks}
                      reference={formData.reference}
                    />
                  </CardContent>
                </Card>
              )}

              {contentDescriptive.length > 0 && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h5" color="primary" gutterBottom>
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
                  </CardContent>
                </Card>
              )}

              {contentNumericals.length > 0 && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h5" color="primary" gutterBottom>
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
                  </CardContent>
                </Card>
              )}

              {contentLong.length > 0 && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h5" color="primary" gutterBottom>
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
                  </CardContent>
                </Card>
              )}
              {/* ... (similar Card components for other question types) */}

              {(contentMcqs.length > 0 ||
                contentBlanks.length > 0 ||
                contentDescriptive.length > 0 ||
                contentNumericals.length > 0 ||
                contentLong.length > 0) && (
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  sx={{ mt: 3 }}
                  onClick={handleExport}
                  disabled={loading}
                >
                  Export Paper
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
