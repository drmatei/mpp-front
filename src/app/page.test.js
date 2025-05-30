// page.test.js
import { validateForm, validateUpdateForm } from './page.js'; 

function testValidateForm() {
  let newEvent = {
    name: 'Test Event',
    description: 'A test description',
    date: '2025-06-15',
    capacity: '500'
  };
  
  let validationErrors = validateForm(newEvent);
  console.assert(Object.keys(validationErrors).length === 0, 'Test failed: validateForm should return no errors for valid input');

  newEvent.name = '';
  validationErrors = validateForm(newEvent);
  console.assert(validationErrors.name === 'Event name is required', 'Test failed: Name validation missing');
}

function testValidateUpdateForm() {
  let updateEvent = {
    currentName: 'Old Event',
    currentDate: '2025-06-01',
    newName: 'New Event',
    newDescription: 'Updated description',
    newDate: '2025-06-15',
    newCapacity: '1000'
  };
  
  let validationErrors = validateUpdateForm(updateEvent);
  console.assert(Object.keys(validationErrors).length === 0, 'Test failed: validateUpdateForm should return no errors for valid input');

  updateEvent.newName = '';
  validationErrors = validateUpdateForm(updateEvent);
  console.assert(validationErrors.newName === 'This field is required', 'Test failed: Update name validation missing');
}

testValidateForm();
testValidateUpdateForm();

console.log('All tests ran. Check console for errors.');
