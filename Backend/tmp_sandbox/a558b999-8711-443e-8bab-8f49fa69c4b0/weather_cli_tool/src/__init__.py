# Initialize the weather_cli_tool package

import logging

# Set up logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Import required modules
from .scraper import scrape_weather_data
from .csv_exporter import export_to_csv
from .cli import create_cli_interface

# Define the main entry point for the package
def main():
    try:
        # Create the CLI interface
        cli_interface = create_cli_interface()
        
        # Parse CLI arguments
        args = cli_interface.parse_args()
        
        # Scrape weather data
        weather_data = scrape_weather_data(args.location)
        
        # Export weather data to CSV
        export_to_csv(weather_data, args.output_file)
        
        # Log a success message
        logging.info('Weather data scraped and exported successfully.')
    except Exception as e:
        # Log an error message
        logging.error(f'An error occurred: {str(e)}')

if __name__ == '__main__':
    main()