require("dotenv").config();
const { z } = require("zod");
const { CognitoIdentityProviderClient, ConfirmForgotPasswordCommand } = require("@aws-sdk/client-cognito-identity-provider");

exports.handler = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    const req = {
        email: requestBody.email,
        confirmationCode:requestBody.otp.trim(),
        newPassword:requestBody.newPassword
    };
    const reqSchema = z.object({
        email: z.string().email(),
        confirmationCode: z.string(),
        newPassword: z.string()
    });
    const valResult = reqSchema.safeParse(req);
    if (!valResult.success) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: valResult.error.formErrors.fieldErrors,
            }),
        };
    }
    const client = new CognitoIdentityProviderClient({ region: "us-east-1" }); 
    const input = {
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: req.email,
        ConfirmationCode: req.confirmationCode,
        Password: req.newPassword,
    };

    try {
        const command = new ConfirmForgotPasswordCommand(input);
        await client.send(command);

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ message: "Password confirmed successfully" }),
        };
    } catch (error) {
        console.error("Error confirming password:", error);

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                message: "Error confirming password",
                error: error.message,
            }),
        };
    }
};