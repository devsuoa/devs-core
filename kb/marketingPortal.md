# Marketing Portal

The **Marketing Portal** provides a form-based interface for Execs to submit marketing requests for events or sponsorship posts. It integrates with Google Sheets via Google Apps Script and automatically creates Asana tasks through Zapier automation.

## Purpose

- Submit marketing requests
- Automatically track requests in Google Sheets
- Automatically create and assign Asana tasks for marketing team workflow

## System Architecture

The marketing portal follows a multi-service integration pattern:

1. **Frontend Form** - React component that collects user input
2. **Google Apps Script** - Receives form data and writes to Google Sheets
3. **Google Sheets** - Stores all marketing request data
4. **Zapier Automation** - Monitors Google Sheets and creates Asana tasks

## Post Types

The portal supports two distinct post types, each with different field requirements:

### Event Posts

Event posts are used for marketing requests related to club events. They require:
- Event name
- Event date
- Event time
- Event location
- Event description
- Optional event suggestions

### Sponsorship Posts

Sponsorship posts are used for marketing requests related to sponsor content. They require:
- Sponsor name
- Sponsorship email request received date
- Optional post date deadline
- Sponsorship event name
- Related hyperlinks
- Sponsorship description

### Common Fields

Both post types share these optional fields:
- Marketing description/purpose
- Pre-written captions (if provided by sponsors)

## Request Submission Flow

The submission flow follows these architectural steps:

### 1. Form Selection and Completion
- User selects post type (event or sponsorship)
- Form dynamically displays relevant fields based on selection
- User fills in required and optional fields
- Form validates required fields before submission

### 2. Data Submission
- Form data is serialised into JSON format
- Data is sent via HTTP POST to Google Apps Script endpoint
- Request uses `no-cors` mode for cross-origin submission

### 3. Google Apps Script Processing
- Apps Script receives the form data
- Validates and processes the data structure
- Writes the data to the configured Google Sheet

### 4. Google Sheets
- All marketing requests are stored in a Google Sheet

### 5. Zapier Automation
- Zapier monitors the Google Sheet for new rows
- When a new request is detected, Zapier creates an Asana task
- Task includes relevant details from the marketing request
- Marketing team receives an email notification

## Integration Points

### Google Apps Script Endpoint

The portal communicates with a Google Apps Script web app that:
- Accepts POST requests with JSON form data
- Validates incoming data structure
- Writes data to the configured Google Sheet
- Handles errors gracefully

### Google Sheets Structure

The Google Sheet maintains a structured format with columns for:
- Post type
- Event-specific fields
- Sponsorship-specific fields
- Common fields (marketing description, captions)
- Timestamp metadata

### Zapier Integration

Zapier automation:
- Monitors Google Sheets for new rows
- Extracts relevant data from the new rows
- Maps data to Asana task fields
- Creates task in the appropriate Asana project
- Includes all relevant marketing request details

## Security Considerations

1. **No-CORS Mode:** Form submission uses `no-cors` mode, which limits response visibility but enables cross-origin requests
2. **Data Validation:** Google Apps Script should validate all incoming data before writing to sheets
3. **Sensitive Information:** Pre-written captions and sponsor links may contain sensitive data - ensure proper access controls on Google Sheet

## Future Enhancements

- [ ] Form field validation feedback (real-time error messages)
- [ ] Draft saving functionality (save incomplete forms)
- [ ] Request history view (view previously submitted requests)
- [ ] Email notifications to submitter when task is created
- [ ] Request status tracking (pending, in-progress, completed)