# boto3 — the complete guide

boto3 is the official AWS SDK for Python and the way data engineers drive AWS from code: moving objects in and out of
S3, kicking off Glue jobs, querying with Athena, reading DynamoDB, sending SQS messages, and fetching secrets. This
guide covers the two interfaces, the full S3 toolkit, credentials, pagination, presigned URLs, error handling, and
other services — with scenarios.

## 1. Clients vs resources

@@diagram:boto3-clients

```python
import boto3
s3   = boto3.client('s3')              # low-level: one method per AWS API call
s3r  = boto3.resource('s3')            # high-level: objects (Bucket, Object)
sess = boto3.Session(profile_name='prod', region_name='us-east-1')   # explicit session
s3   = sess.client('s3')
```

- **client** — thin wrapper over the API; returns dicts; supports every operation. Most data work uses this.
- **resource** — friendlier object model (`bucket.objects.all()`), but not available for every service.

## 2. S3 — the operations you'll use daily

```python
# upload / download whole files (handles multipart automatically for big files)
s3.upload_file('local.csv', 'my-bucket', 'data/local.csv')
s3.download_file('my-bucket', 'data/local.csv', 'local.csv')

# put / get bytes directly
s3.put_object(Bucket='my-bucket', Key='k.json', Body=b'{"a":1}',
              ContentType='application/json')
body = s3.get_object(Bucket='my-bucket', Key='k.json')['Body'].read()

# metadata, existence, delete, copy
s3.head_object(Bucket='my-bucket', Key='k.json')['ContentLength']   # size in bytes
s3.delete_object(Bucket='my-bucket', Key='old.csv')
s3.copy_object(Bucket='dst', Key='k', CopySource={'Bucket':'src','Key':'k'})

# batch delete (up to 1000 keys per call)
s3.delete_objects(Bucket='b', Delete={'Objects': [{'Key': k} for k in keys]})
```

## 3. Listing with pagination

S3 returns at most **1000 keys** per response, so always paginate:

```python
paginator = s3.get_paginator('list_objects_v2')
for page in paginator.paginate(Bucket='lake', Prefix='raw/2024/'):
    for obj in page.get('Contents', []):
        print(obj['Key'], obj['Size'], obj['LastModified'])
```

## 4. Presigned URLs

Grant temporary, credential-free access to a single object/operation:

```python
# let someone download for one hour
url = s3.generate_presigned_url('get_object',
        Params={'Bucket': 'b', 'Key': 'report.pdf'}, ExpiresIn=3600)

# let a browser upload directly
upload = s3.generate_presigned_post('b', 'uploads/${filename}', ExpiresIn=600)
```

## 5. Credentials — never hard-code

boto3 resolves credentials automatically, in order:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`)
2. Shared config (`~/.aws/credentials`, selected by `profile_name`)
3. **IAM role** attached to the EC2/ECS/Lambda compute — **the best choice in production** (short-lived, auto-rotated,
   nothing in code)

```python
boto3.Session(profile_name='dev')          # pick a local profile
# in prod, attach an IAM role and pass nothing — boto3 finds it
```

## 6. Error handling and waiters

```python
from botocore.exceptions import ClientError

try:
    s3.head_object(Bucket='lake', Key='raw/today.parquet')
except ClientError as e:
    if e.response['Error']['Code'] == '404':
        print("today's file hasn't landed yet")
    else:
        raise

# block until a resource exists (polls for you)
s3.get_waiter('object_exists').wait(Bucket='lake', Key='raw/today.parquet')
```

## 7. Other services — same pattern

```python
# Athena: run SQL over S3
athena = boto3.client('athena')
q = athena.start_query_execution(
    QueryString="SELECT count(*) FROM sales",
    QueryExecutionContext={'Database': 'analytics'},
    ResultConfiguration={'OutputLocation': 's3://results/'})

# Glue: start an ETL job
boto3.client('glue').start_job_run(JobName='daily-etl')

# DynamoDB: read/write items
tbl = boto3.resource('dynamodb').Table('users')
tbl.put_item(Item={'id': '1', 'name': 'Ada'})
tbl.get_item(Key={'id': '1'})['Item']

# SQS: send a message
boto3.client('sqs').send_message(QueueUrl=url, MessageBody='go')

# Secrets Manager: fetch a secret (don't hard-code DB passwords)
secret = boto3.client('secretsmanager').get_secret_value(SecretId='prod/db')['SecretString']
```

## 8. Scenario A — check for, then process, today's landing file

```python
import boto3, datetime as dt
from botocore.exceptions import ClientError
s3 = boto3.client('s3')

key = f"raw/{dt.date.today():%Y/%m/%d}/events.parquet"
try:
    size = s3.head_object(Bucket='lake', Key=key)['ContentLength']
except ClientError:
    raise SystemExit(f'{key} not present yet')   # exit non-zero for the scheduler

s3.download_file('lake', key, '/tmp/events.parquet')
process('/tmp/events.parquet')
```

## 9. Scenario B — archive and clean a prefix

```python
paginator = s3.get_paginator('list_objects_v2')
old = []
for page in paginator.paginate(Bucket='lake', Prefix='staging/'):
    for o in page.get('Contents', []):
        if o['LastModified'] < cutoff:
            s3.copy_object(Bucket='archive', Key=o['Key'],
                           CopySource={'Bucket': 'lake', 'Key': o['Key']})
            old.append({'Key': o['Key']})
for i in range(0, len(old), 1000):                 # batch-delete in chunks of 1000
    s3.delete_objects(Bucket='lake', Delete={'Objects': old[i:i+1000]})
```

## 10. boto3 vs fsspec

For plain file reads/writes, **fsspec** (`pd.read_parquet('s3://...')`) is simpler and portable across clouds. Reach
for **boto3** when you need AWS-specific control — presigned URLs, bucket policies, lifecycle, batch delete — or any
non-S3 service (Glue, Athena, DynamoDB, SQS, Secrets Manager). Real pipelines use both: fsspec for data I/O, boto3 for
management and orchestration.

## 11. Practice

1. Upload a local file to S3, then verify it exists with `head_object`.
2. Sum the sizes of every object under a prefix using a paginator.
3. Generate a 1-hour download link for a private object.
4. Catch a 404 from `head_object` and exit non-zero so a scheduler marks the job failed.

boto3 is the universal remote control for AWS; learn the client pattern + S3 toolkit + IAM-role credentials and the
rest of the services follow the same shape.
