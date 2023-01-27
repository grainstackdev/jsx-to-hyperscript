// @flow

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  })
})

// $FlowFixMe
export const handler = serverless(app)
