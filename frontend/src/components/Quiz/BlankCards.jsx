import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import { MathJax } from "better-react-mathjax";
export default function BlankCards({ content, reference }) {
  return (
    <div>
      {content.length > 0 ? (
        <Grid container spacing={2}>
          {content.map((blank, index) => (
            <Grid item xs={12} key={index}>
              <Card elevation={3}>
                <MathJax>
                  <CardContent>
                    <Typography variant="h6">
                      {index + 1}. {blank.question}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      <strong>Correct Answer:</strong> {blank.correct_answer}
                    </Typography>
                    {blank.reference && reference ? (
                      <Typography variant="body2" color="textSecondary">
                        <strong>Reference:</strong> {blank.reference}
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
