#!/bin/bash

# Directory containing the files
directory="img"

# Directory to store thumbnails
thumbnail_directory="thumbnails"

# JSON output file
output_file="files.json"

# Initialize JSON structure
echo '{ "textures": [' > $output_file

# Create thumbnail directory if it doesn't exist
mkdir -p $thumbnail_directory

# Get the total number of files
total_files=$(ls -1q "$directory" | wc -l)
current_file=0

# Iterate over files in the directory
first_entry=true
for file in "$directory"/*; do
    filename=$(basename "$file")
    # Extract name
    name="${filename#*-}"
    name="${name%.*}"

    # Generate and compress thumbnail
    convert "$file" -quality 20 -resize 100x100 "$thumbnail_directory/$filename"

    # Increment the current file counter
    ((current_file++))

    # Add comma if not the first entry
    if [ "$first_entry" = true ]; then
        first_entry=false
    else
        echo ',' >> $output_file
    fi

    # Append JSON entry
    echo '    {' >> $output_file
    echo '        "filename": "'"${filename}"'",' >> $output_file
    echo '        "name": "'"${name}"'",' >> $output_file
    echo '    }' >> $output_file

    # Print the progress
    echo "Progress: $current_file/$total_files"
done

# Close JSON structure
echo '] }' >> $output_file

echo "Conversion and thumbnail generation complete. Output written to $output_file"
