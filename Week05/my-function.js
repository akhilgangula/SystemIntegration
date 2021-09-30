exports.handler = async (event) => {
    // TODO implement
    const {multiValueQueryStringParameters: {keyword} = {}} = event;
    const response = {
        statusCode: 200,
        body: JSON.stringify({message: `Hello ${keyword}!!, you have reached AWS Lambda function.`}),
    };
    return response;
};
