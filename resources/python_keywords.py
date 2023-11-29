import random
from datetime import datetime


def get_random_number_from_range(num):
    return random.randint(1, num)

def check_date_time_descending_order(a,b):
    # Define the date format
    date_format = '%B %d, %Y at %I:%M:%S %p'
    
    # Parse the date strings into datetime objects
    date1 = datetime.strptime(a, date_format)
    date2 = datetime.strptime(b, date_format)
    
    # Compare the dates
    if date1 > date2:
        return  True
    elif date1 < date2:
        return  False
    else:
        return  True

