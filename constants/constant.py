#URL
url='http://localhost:8888/lab'

#console URL
console_cluster='https://console.cloud.google.com/dataproc/clusters?project=acn-ytmusicsonos'

#Browser
edge='Edge'
chrome='headlesschrome'

#Token from command prompt
token='be566856f6e875f9e597006b44cec1877116ca737bfee239'

#Wait time
wait_min = "3"
wait_mid = "5"
wait_max = "10"
wait_20 = "20"
wait_30 = "30"

#GCS File 
jar1_gcs_link="gs://dataproc-extension/DO NOT DELETE/JavaHelloWorld.jar"
jar2_gcs_link="gs://dataproc-extension/DO NOT DELETE/helloworld-2.0.jar"
sparkr_gcs_link="gs://dataproc-extension/DO NOT DELETE/helloworld.r"
pyspark_gcs_link1="gs://dataproc-extension/DO NOT DELETE/helloworld1.py"
pyspark_gcs_link2="gs://dataproc-extension/DO NOT DELETE/helloworld2.py"
sparksql_gcs_link="gs://dataproc-extension/DO NOT DELETE/sampleSQL.sql"
txt_gcs_link="gs://dataproc-extension/DO NOT DELETE/helloworld.txt"
query_txt="CREATE TABLE Persons (PersonID int,LastName varchar(255),FirstName varchar(255),Address varchar(255),City varchar(255)); SELECT * FROM persons;"

#container image
container_image_txt="us-central1-docker.pkg.dev/dataproc-jupyter-extension-dev/test-artifact-image"

#service account
service_account_txt="411524708443-compute@developer.gserviceaccount.com"

#customer managed encrytion keys
encryption_key_txt="projects/dataproc-jupyter-extension-dev/locations/us-central1/keyRings/keyring1/cryptoKeys/key1"