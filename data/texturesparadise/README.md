# Texture Paradise

## prepare.sh

Textures need to be in the folder ``img``.

This will generate the thumbnails and create a file containing the texture metadata.

### Prerequisites

Make sure you have ``imagemagick`` installed.

### Usage

Run the script:

```
./prepare.sh
```

Output:

```
files.json
thumbnails/
```

### Notice

``files.json`` is hosted by the application, ``thumbnails/`` and ``img/`` should be kept on a remote server.
