import datetime
import json
from flask import Response

def json_response(data, status_code=200):
    return Response(json.dumps(data), status=status_code, mimetype='application/json')

def error_response(message, status_code=400):
    return json_response({'error': message}, status_code)

def validate_date(date_string, date_format='%Y-%m-%d'):
    try:
        datetime.datetime.strptime(date_string, date_format)
        return True
    except ValueError:
        return False

def validate_integer(value):
    try:
        int(value)
        return True
    except ValueError:
        return False

def validate_string(value):
    if not isinstance(value, str):
        return False
    return True

def validate_boolean(value):
    if value.lower() == 'true' or value.lower() == 'false':
        return True
    return False