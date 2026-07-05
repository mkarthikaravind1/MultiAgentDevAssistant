# Weather CLI Tool Usage
## Introduction
The Weather CLI Tool is a command-line interface application designed to scrape weather data from a specified source and save it to a CSV file. This document provides instructions on how to use the tool.
## Requirements
* Python 3.8 or higher
* Required libraries: beautifulsoup4, pandas, click
## Installation
1. Clone the repository: `git clone https://github.com/your-repo/weather_cli_tool.git`
2. Navigate to the project directory: `cd weather_cli_tool`
3. Install required libraries: `pip install -r requirements.txt`
## Usage
1. Run the tool: `python main.py`
2. Follow the prompts to specify the location and CSV file path.
## Options
* `--location`: Specify the location for which to scrape weather data (e.g., city, state, country)
* `--csv-path`: Specify the path to save the CSV file
* `--help`: Display help message and exit
## Example Usage
`python main.py --location 'New York, USA' --csv-path './weather_data.csv`
## Troubleshooting
* If the tool fails to scrape weather data, check the specified location and ensure it is valid.
* If the tool fails to save the CSV file, check the specified CSV path and ensure it is writable.
## Contributing
Contributions are welcome. Please submit a pull request with your changes and a brief description of the changes made.