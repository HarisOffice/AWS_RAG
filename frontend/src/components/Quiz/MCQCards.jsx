import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import { MathJax } from "better-react-mathjax";
export default function MCQCards({ content, reference }) {
  return (
    <div>
      {content.length > 0 ? (
        <Grid container spacing={2}>
          {content.map((mcq, index) => (
            <Grid item xs={12} key={index}>
              <Card elevation={3}>
                <MathJax>
                  <CardContent>
                    <Typography variant="h6">
                      {index + 1}. {mcq.question}
                    </Typography>
                    <ul style={{ paddingLeft: "20px", marginTop: "10px" }}>
                      {mcq.options.map((option, optionIndex) => (
                        <li key={optionIndex}>
                          <Typography variant="body1">{option}</Typography>
                        </li>
                      ))}
                    </ul>
                    {mcq.correct_answer ? (
                      <Typography variant="body2" color="textSecondary">
                        <strong>Correct Answer:</strong> {mcq.correct_answer}
                      </Typography>
                    ) : (
                      ""
                    )}

                    {mcq.reference && reference ? (
                      <Typography variant="body2" color="textSecondary">
                        <strong>Reference:</strong> {mcq.reference}
                      </Typography>
                    ) : (
                      ""
                    )}
                  </CardContent>
                </MathJax>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography>Nothing generated yet.</Typography>
      )}
    </div>
  );
}
