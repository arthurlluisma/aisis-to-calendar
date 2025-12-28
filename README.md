# AISIS to Calendar

The "AISIS to Calendar" extension aims to automatically convert your AISIS schedule into a file that can be imported to any calendar tool of your choice. This aims to solve the tedious task of having to manually encode your calendar everytime a new semester rolls in.

## Overview

AISIS (Ateneo Integrated Student Information System) is the student portal of the Ateneo de Manila University. This browser extension automates the process of converting class schedules from AISIS into an ICS (iCalendar) file format, which can be imported into any calendar application.

## Prerequisites

**Required:** This extension requires the [AISIS Prettify Extension](https://github.com/Angelo-Funelas/AISISPrettifyManifestV3/tree/master) to be installed first. The AISIS to Calendar extension is designed to work in conjunction with AISIS Prettify.

## Installation

### Manual Installation (Current Method)

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now appear in your browser toolbar

### Future Availability

This extension will soon be integrated into the AISIS Prettify Extension and will be available on:
- Chrome Web Store
- Firefox Add-ons

## Usage

1. Navigate to your "My Class Schedule" page on AISIS
2. Click the AISIS to Calendar extension icon in your browser toolbar
3. Enter the first and last dates of the current term (defaults are provided based on the current term)
4. Click the "Convert" button in the extension popup
5. A `schedule.ics` file will be downloaded automatically
6. Import the `schedule.ics` file into your preferred calendar tool

## Features

- Automatically extracts class schedule information from AISIS
- Generates a standard ICS file compatible with most calendar applications
- Provides default term dates based on the current academic term
- Simple one-click conversion process

## Caveats and Limitations

- **Dependency Requirement:** The AISIS Prettify Extension must be installed for this extension to work properly
- **Manual Date Entry:** Users must manually supply the first and last dates of the term (though defaults are provided)
- **Schedule Updates:** If you change your schedule after importing, you will need to:
  1. Re-export and re-import the new ICS file
  2. Manually remove the old classes from your calendar tool

## Compatibility

### Tested Platforms
- **Browser:** Chrome (fully supported)
- **Calendar Tools:** Google Calendar (tested)

### Future Testing
Testing is planned for:
- Firefox browser
- Edge browser
- Additional calendar applications (Outlook, Apple Calendar, etc.)

## Contributing

Contributions are welcome! If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request.

## License

This project will be licensed under the MIT License (coming soon). The dependency extension, AISIS Prettify, is currently licensed under the MIT License.

## Related Projects

- [AISIS Prettify Extension](https://github.com/Angelo-Funelas/AISISPrettifyManifestV3/tree/master) - Required dependency for this extension
