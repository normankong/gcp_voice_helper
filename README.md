# GCP Voice Helper
Use Google Cloud Speech to Text to extract voice into text. Combined with GCP Translate and Text to speech to perform translation on the fly.

# Request Parameter
Content-Type : "application/json"

```Body 
{
	"identify": "your identify",
	"url" : "https://xxxxxx/filename.oga"
}
```

Response
```
{
    "code": "000",
    "message": "Message to be extracted"
}
```
Failure case
If no URL passed : Bad request

If the URL is not contains any text
```
{
    code : "409",
    message : ""
}
```


# Setup
Require a .env file and credential.json which is download from Google Vision API

* .env
* GOOGLE_APPLICATION_CREDENTIALS=credential.json
```
credential.json
{
    "type": "service_account",
    "project_id": "",
    "private_key_id": "",
    "private_key": "-----BEGIN PRIVATE KEY-----\\nDn6T1LbNI8Z+Wwc7z52tY=\n-----END PRIVATE KEY-----\n",
    "client_email": "xxxxx@appspot.gserviceaccount.com",
    "client_id": "xxxx",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/%40appspot.gserviceaccount.com"
}
```
# Deployment
* Local Simulator  (With functions-framework)
    npm start

# Improved Security
* Require to provide JWT token which is pre-generated offline
