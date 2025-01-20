import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import { MathJax } from "better-react-mathjax";
export default function QuestionCards({ content }) {
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
