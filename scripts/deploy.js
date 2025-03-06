import "dotenv/config";
import {
  LambdaClient,
  UpdateFunctionCodeCommand,
} from "@aws-sdk/client-lambda";
import fs from "fs/promises";
import AdmZip from "adm-zip";

// Create a Lambda client
const lambdaClient = new LambdaClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const zipCurrentDirectory = async (sourceDir, outputFilePath) => {
  const zip = new AdmZip();
  zip.addLocalFolder(sourceDir);
  await zip.writeZipPromise(outputFilePath);
  console.log(`Zip file created: ${outputFilePath}`);
};

// Function to update Lambda function code
const updateLambdaFunction = async (zipFilePath) => {
  const zipFileContents = await fs.readFile(zipFilePath);

  const command = new UpdateFunctionCodeCommand({
    FunctionName: process.env.FUNCTION_NAME,
    ZipFile: zipFileContents,
  });

  try {
    const data = await lambdaClient.send(command);
    console.log("Success", data);
  } catch (err) {
    console.error("Error", err);
  }
};

const deleteFile = async (file) => {
  try {
    await fs.unlink(file);
    console.log(`File ${file} deleted successfully`);
  } catch (err) {
    console.error(`Error deleting file ${file}:`, err);
  }
};

const zipFilePath = "server.zip"; // The desired output ZIP file path

const main = async () => {
  try {
    await zipCurrentDirectory(".", zipFilePath);
    console.log("Project zipped successfully.");

    await updateLambdaFunction(zipFilePath);

    await deleteFile(zipFilePath);
  } catch (err) {
    console.error("Error:", err);
  }
};

main();
