// This example requires the following input to succeed:
// { "command": "do something" }
use std::env::var;
use std::time::Instant;

use lambda_runtime::{handler_fn, Context, Error};
use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use tracing_subscriber::EnvFilter;

/// This is also a made-up example. Requests come into the runtime as unicode
/// strings in json format, which can map to any structure that implements `serde::Deserialize`
/// The runtime pays no attention to the contents of the request payload.
#[derive(Debug, Deserialize)]
struct Request {
    command: String,
}

/// This is a made-up example of what a response structure may look like.
/// There is no restriction on what it can be. The runtime requires responses
/// to be serialized into json. The runtime pays no attention
/// to the contents of the response payload.
#[derive(Debug, Serialize)]
struct SuccessResponse {
    req_id: String,
    msg: String,
}

#[derive(Debug, Serialize)]
struct FailureResponse {
    pub body: String,
}

// Implement Display for the Failure response so that we can then implement Error.
impl std::fmt::Display for FailureResponse {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.body)
    }
}

// Implement Error for the FailureResponse so that we can `?` (try) the Response
// returned by `lambda_runtime::run(func).await` in `fn main`.
impl std::error::Error for FailureResponse {}

type Response = Result<SuccessResponse, FailureResponse>;

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        // Setup from the environment (RUST_LOG)
        .with_env_filter(EnvFilter::from_default_env())
        // this needs to be set to false, otherwise ANSI color codes will
        // show up in a confusing manner in CloudWatch logs.
        .with_ansi(false)
        // disabling time is handy because CloudWatch will add the ingestion time.
        .without_time()
        .init();

    let start = Instant::now();
    let func = handler_fn(my_handler);
    lambda_runtime::run(func).await?;
    debug!("Call lambda took {:.2?}", start.elapsed());

    Ok(())
}

pub(crate) async fn my_handler(event: Request, ctx: Context) -> Response {
    info!("Request: {:?}", event);

    let bucket_name = var("BUCKET_NAME")
        .expect("A BUCKET_NAME must be set in this app's Lambda environment variables.");

    // extract some useful info from the request
    let command = event.command;

    // Generate a filename based on when the request was received.
    let filename = format!("{}.txt", time::OffsetDateTime::now_utc().unix_timestamp());

    let start = Instant::now();

    let config = aws_config::load_from_env().await;
    let s3 = aws_sdk_s3::Client::new(&config);

    debug!("Created an S3 client in {:.2?}", start.elapsed());

    let _ = s3
        .put_object()
        .bucket(bucket_name)
        .body(command.as_bytes().to_owned().into())
        .key(&filename)
        .content_type("text/plain")
        .send()
        .await
        .map_err(|err| {
            // In case of failure, log a detailed error to CloudWatch.
            error!(
                "failed to upload file '{}' to S3 with error: {}",
                &filename, err
            );
            // The sender of the request receives this message in response.
            FailureResponse {
                body: "The lambda encountered an error and your message was not saved".to_owned(),
            }
        })?;

    info!(
        "Successfully stored the incoming request in S3 with the name '{}'",
        &filename
    );

    // prepare the response
    let resp = SuccessResponse {
        req_id: ctx.request_id,
        msg: format!("Command {} executed.", command),
    };

    // return `Response` (it will be serialized to JSON automatically by the runtime)
    Ok(resp)
}
