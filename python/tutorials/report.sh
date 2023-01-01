#!/bin/bash
sdk='python'
id=${GITHUB_SHA:-$(uuidgen)}
[ "$TEST_REPORT_SANDBOX" = "False" ] && sandbox='false' || sandbox='true'
payload='{
      "sdk":"'"$sdk"'",
      "group":"selenium",
      "id":"'$id'",
      "sandbox":'$sandbox',
      "mandatory":false,
      "results": [
        {
          "test_name": "tutorial_basic",
          "passed": true
        },
        {
          "test_name": "tutorial_ultrafastgrid",
          "passed": true
        },
        {
          "test_name": "tutorial_images",
          "passed": true
        }
      ]
}'
echo $payload

curl -i -H "Accept: application/json" -H "Content-Type: application/json" -X POST --data "$payload" "http://applitools-quality-server.herokuapp.com/result"
