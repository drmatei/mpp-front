// page.js
"use client";
import { useState } from 'react';
import styles from './page.module.css';
import { useEffect, useRef } from 'react';
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// mock events
const initialEvents = [
  { id: 1, name: "Summer Music Festival", description: "Annual outdoor music event", date: "2025-07-15", capacity: 5000 },
  { id: 2, name: "Tech Conference", description: "Latest in technology innovations", date: "2025-04-22", capacity: 1200 },
  { id: 3, name: "Food & Wine Expo", description: "Culinary delights from around the world", date: "2025-05-10", capacity: 3000 },
  { id: 4, name: "Workshop", description: "Internship offers for UBB students", date: "2025-03-13", capacity: 300 },
  { id: 5, name: "Christmas Fair", description: "Christmas decorations and gifts", date: "2025-12-20", capacity: 1000 },
  { id: 6, name: "Book Launch", description: "New book release by a local author", date: "2025-09-05", capacity: 200 },
  { id: 7, name: "Art Exhibition", description: "Local artists showcase their work", date: "2025-06-18", capacity: 500 },
  { id: 8, name: "Charity Gala", description: "Fundraising event for local charities", date: "2025-11-30", capacity: 800 },
  { id: 9, name: "Fashion Show", description: "Latest trends on the runway", date: "2025-10-25", capacity: 1500 },
  { id: 10, name: "Film Festival", description: "Celebrating international cinema", date: "2025-08-12", capacity: 2500 }
];

export default function Home() {
    useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', '10e150d9cfa8ccae63f12256a7d36a525b370503');
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showEventsList, setShowEventsList] = useState(false);
  const [sortByCapacity, setSortByCapacity] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [isNetworkDown, setIsNetworkDown] = useState(false);
  const [isServerDown, setIsServerDown] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Track loading state
  const [hasMore, setHasMore] = useState(true); // Track if more events are available
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleEvents, setVisibleEvents] = useState([]); // Events currently visible in the modal
  const [itemsToShow, setItemsToShow] = useState(10); // Number of events to show initially
  const [showInfiniteScrollModal, setShowInfiniteScrollModal] = useState(false);
  const [inputToken, setInputToken] = useState('');
  const [loginError, setLoginError] = useState('');
  const [registerForm, setRegisterForm] = useState({ email: '', name: '', password: '' });
const [registerError, setRegisterError] = useState('');
const [registerToken, setRegisterToken] = useState('');
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    capacity: ''
  });
  const [deleteEvent, setDeleteEvent] = useState({
    name: '',
    date: ''
  });
  const [validationErrors, setValidationErrors] = useState({
    currentName: '',
    currentDate: '',
    newName: '',
    newDescription: '',
    newDate: '',
    newCapacity: ''
  });
  const [updateEvent, setUpdateEvent] = useState({
    currentName: '',
    currentDate: '',
    newName: '',
    newDescription: '',
    newDate: '',
    newCapacity: ''
  });
  const [updateValidationErrors, setUpdateValidationErrors] = useState({
    currentName: '',
    currentDate: '',
    newName: '',
    newDescription: '',
    newDate: '',
    newCapacity: ''
  });
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [chartData, setChartData] = useState({
    capacityData: {
      labels: [],
      datasets: [],
    },
    monthlyData: {
      labels: [],
      datasets: [],
    },
    utilizationData: {
      labels: [],
      datasets: [],
    }
  });
  const [pendingOperations, setPendingOperations] = useState([]);

  // Initialize pending operations from localStorage on the client side
  useEffect(() => {
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setAuthToken(storedToken);
    } else {
      localStorage.setItem('authToken', '872807109b798f94c288bf615ce5d2f7936e1dbf');
      setAuthToken('872807109b798f94c288bf615ce5d2f7936e1dbf');
    }
  }
}, []);


  const addPendingOperation = (operation) => {
    const updatedOperations = [...pendingOperations, operation];
    setPendingOperations(updatedOperations);
    localStorage.setItem('pendingOperations', JSON.stringify(updatedOperations));
  };




  // Listen for network changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsNetworkDown(false);
      const handleOffline = () => setIsNetworkDown(true);
  
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
  
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Check server status periodically
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('https://mpp-backend-t8mc.onrender.com/api/events/');
        if (!response.ok) throw new Error('Server down');
        setIsServerDown(false);
      } catch (error) {
        setIsServerDown(true);
      }
    };

    const interval = setInterval(checkServerStatus, 10000); // Check every 10 seconds
    checkServerStatus(); // Initial check

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsNetworkDown(!navigator.onLine);
    }
  }, []);

  useEffect(() => {
    const syncPendingOperations = async () => {
      if (!isNetworkDown && !isServerDown && pendingOperations.length > 0) {
        for (const operation of pendingOperations) {
          try {
            if (operation.type === 'ADD') {
              await fetch('https://mpp-backend-t8mc.onrender.com/api/events/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json',
                  'Authorization': `Token ${localStorage.getItem('authToken')}`, // Include the token
                },
                body: JSON.stringify(operation.data),
              });
            } else if (operation.type === 'DELETE') {
              await fetch(`https://mpp-backend-t8mc.onrender.com/api/events/${operation.id}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Token ${localStorage.getItem('authToken')}`, // Include the token
                  'Content-Type': 'application/json',
                },
              });
            }
          } catch (error) {
            console.error('Error syncing operation:', error);
          }
        }
  
        // Clear the queue after syncing
        setPendingOperations([]);
        localStorage.removeItem('pendingOperations');
      }
    };
  
    syncPendingOperations();
  }, [isNetworkDown, isServerDown]);

const [authToken, setAuthToken] = useState('');



const handleTokenLogin = () => {
  if (!inputToken.trim()) {
    setLoginError('Token is required');
    return;
  }

  // Save the token to localStorage and update the state
  localStorage.setItem('authToken', inputToken.trim());
  setAuthToken(inputToken.trim()); // Update the state
  setLoginError(''); // Clear any previous errors
  console.log('Token saved successfully:', inputToken.trim());
  alert('Token saved successfully!');
};

useEffect(() => {
  if (authToken) {
    fetchAllEvents();
  }
}, [authToken]);


const fetchAllEvents = async () => {
  let page = 1;
  let allEvents = [];
  let hasMorePages = true;

  if (!authToken) {
    console.error('Auth token is missing!');
    setIsServerDown(true); // Mark server as down
    return;
  }

  try {
    while (hasMorePages) {
      const response = await fetch(`https://mpp-backend-t8mc.onrender.com/api/events/?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${authToken}`, // Use the token from state
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        console.error('Unauthorized: Invalid or missing token');
        setIsServerDown(true); // Mark server as down
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      allEvents = [...allEvents, ...data.results]; // Append events from the current page
      hasMorePages = !!data.next; // Check if there is a next page
      page += 1; // Increment the page number
    }

    setEvents(allEvents); // Set all events in the state
    setIsServerDown(false); // Mark server as up
  } catch (error) {
    console.error("Error fetching all events:", error);
    setIsServerDown(true); // Mark server as down
  }
};
  
  // Call this function in your useEffect
  useEffect(() => {
    fetchAllEvents();
  }, []);


  useEffect(() => {
    console.log("Items to show:", itemsToShow); // Debugging
    console.log("Total events:", events.length); // Debugging
  
    if (itemsToShow >= events.length) {
      console.log("No more events to load."); // Debugging
      setHasMore(false); // Stop loading more events
    }
  }, [itemsToShow, events]);
  


// ==========
// Fetch events from the API
// ==========







  // Fetch events with pagination




  // Attach scroll event listener

  useEffect(() => {
    if (!hasMore) {
      console.log("No more events to load.");
    }
  }, [hasMore]);

  useEffect(() => {
    if (!showInfiniteScrollModal) return; // Only run when the modal is open
  
    const modalContent = document.querySelector(`.${styles.scrollableContent}`);
  
    if (!modalContent) {
      console.error("Modal content not found!"); // Debugging
      return;
    }
  
    const handleScroll = () => {
      if (
        modalContent.scrollTop + modalContent.clientHeight >= modalContent.scrollHeight - 100 &&
        itemsToShow < events.length
      ) {
        console.log("Loading more events..."); // Debugging
        setItemsToShow((prev) => prev + 10); // Load 10 more events
      }
    };
  
    modalContent.addEventListener('scroll', handleScroll);
  
    return () => {
      modalContent.removeEventListener('scroll', handleScroll);
    };
  }, [showInfiniteScrollModal, itemsToShow, events]);
  
  // Update visible events whenever itemsToShow changes
  useEffect(() => {
    setVisibleEvents(events.slice(0, itemsToShow));
  }, [itemsToShow, events]);



  // WebSocket connection to receive real-time updates


  // Registration handler
const handleRegisterInputChange = (e) => {
  const { name, value } = e.target;
  setRegisterForm({ ...registerForm, [name]: value });
  setRegisterError('');
};

const handleRegister = async () => {
  if (!registerForm.email || !registerForm.name || !registerForm.password) {
    setRegisterError('All fields are required');
    return;
  }
  try {
    const response = await fetch('https://mpp-backend-t8mc.onrender.com/api/events/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerForm),
    });
    const data = await response.json();
    if (response.ok) {
      setRegisterToken(data.token);
      setRegisterError('');
    } else {
      setRegisterError(data.error || 'Registration failed');
    }
  } catch (err) {
    setRegisterError('Network error');
  }
};

  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Interval reference for cleanup
  const dataUpdateInterval = useRef(null);

  // Prepare chart data whenever events change
  useEffect(() => {
    updateChartData();
    
    // Set up periodic data updates (simulating real-time data)
    if (!dataUpdateInterval.current) {
      dataUpdateInterval.current = setInterval(() => {
        simulateDataChange();
      }, 5000); // Update every 5 seconds
    }
    
    // Cleanup interval on component unmount
    return () => {
      if (dataUpdateInterval.current) {
        clearInterval(dataUpdateInterval.current);
      }
    };
  }, [events]);

  useEffect(() => {
    updateChartData();
  }, [events]);

  // Function to update all chart data based on current events
  const updateChartData = () => {
    // 1. Capacity Data for Bar Chart
    const capacityLabels = events.map(event => event.name);
    const capacityValues = events.map(event => event.capacity);
    
    // 2. Monthly Data for Line Chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const eventsByMonth = Array(12).fill(0);
    
    events.forEach(event => {
      const date = new Date(event.date);
      const month = date.getMonth();
      eventsByMonth[month]++;
    });
    
    // 3. Utilization Data for Pie Chart
    const totalCapacity = events.reduce((sum, event) => sum + event.capacity, 0);
    const projectedAttendance = Math.floor(totalCapacity * 0.85); // Simulating 85% attendance
    const remainingCapacity = totalCapacity - projectedAttendance;
    
    setChartData({
      capacityData: {
        labels: capacityLabels,
        datasets: [
          {
            label: 'Event Capacity',
            data: capacityValues,
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
          },
        ],
      },
      monthlyData: {
        labels: months,
        datasets: [
          {
            label: 'Events per Month',
            data: eventsByMonth,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
        ],
      },
      utilizationData: {
        labels: ['Projected Attendance', 'Available Capacity'],
        datasets: [
          {
            label: 'Capacity Utilization',
            data: [projectedAttendance, remainingCapacity],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
            ],
            borderWidth: 1,
          },
        ],
      }
    });
  };

  // Simulate asynchronous data changes (for real-time updates)
  const simulateDataChange = () => {
    // Randomly modify one event's capacity to simulate real-time data updates
    if (events.length > 0) {
      const updatedEvents = [...events];
      const randomIndex = Math.floor(Math.random() * updatedEvents.length);
      const randomChange = Math.floor(Math.random() * 200) - 100; // Random change between -100 and +100
      
      updatedEvents[randomIndex] = {
        ...updatedEvents[randomIndex],
        capacity: Math.max(100, updatedEvents[randomIndex].capacity + randomChange)
      };
      
      setEvents(updatedEvents);
      // Chart data will update via the useEffect that depends on events
    }
  };

  // Get current events for pagination
  const indexOfLastEvent = currentPage * itemsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(events.length / itemsPerPage);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Event Analytics',
      },
    },
  };

  const handleShowDashboard = () => {
    setShowDashboard(true);
  };
  
  const [showDashboard, setShowDashboard] = useState(false);
  

  const handleSearch = () => {
    setShowEventsList(true);
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setValidationErrors({
      name: '',
      description: '',
      date: '',
      capacity: ''
    });
  };

  const handleUpdate = () => {
      setShowUpdateForm(true);
      setUpdateEvent({
        currentName: '',
        currentDate: '',
        newName: '',
        newDescription: '',
        newDate: '',
        newCapacity: ''
      });
      setUpdateValidationErrors({
        currentName: '',
        currentDate: '',
        newName: '',
        newDescription: '',
        newDate: '',
        newCapacity: ''
      });
      setUpdateError('');
      setUpdateSuccess('');
  };

  const handleDelete = () => {
    setShowDeleteForm(true);
    setDeleteEvent({
      name: '',
      date: ''
    });
    setDeleteError('');
    setDeleteSuccess('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: value
    });
    
    setValidationErrors({
      ...validationErrors,
      [name]: ''
    });
  };

  const handleDeleteInputChange = (e) => {
    const { name, value } = e.target;
    setDeleteEvent({
      ...deleteEvent,
      [name]: value
    });
    
    setDeleteError('');
    setDeleteSuccess('');
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateEvent({
      ...updateEvent,
      [name]: value
    });
    
    setUpdateValidationErrors({
      ...updateValidationErrors,
      [name]: ''
    });
    
    setUpdateError('');
    setUpdateSuccess('');
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    if (!newEvent.name.trim()) {
      errors.name = 'Event name is required';
      isValid = false;
    }
    
    if (!newEvent.description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    }
    
    if (!newEvent.date) {
      errors.date = 'Date is required';
      isValid = false;
    }
    
    if (!newEvent.capacity) {
      errors.capacity = 'Capacity is required';
      isValid = false;
    } else if (isNaN(Number(newEvent.capacity))) {
      errors.capacity = 'Capacity must be a valid number';
      isValid = false;
    }
    
    setValidationErrors(errors);
    return isValid;
  };

  const validateUpdateForm = () => {
    const errors = {};
    let isValid = true;
    
    if (!updateEvent.currentName.trim()) {
      errors.currentName = 'This field is required';
      isValid = false;
    }
    
    if (!updateEvent.currentDate) {
      errors.currentDate = 'This field is required';
      isValid = false;
    }
    
    if (!updateEvent.newName.trim()) {
      errors.newName = 'This field is required';
      isValid = false;
    }
    
    if (!updateEvent.newDescription.trim()) {
      errors.newDescription = 'This field is required';
      isValid = false;
    }
    
    if (!updateEvent.newDate) {
      errors.newDate = 'This field is required';
      isValid = false;
    }
    
    if (!updateEvent.newCapacity) {
      errors.newCapacity = 'This field is required';
      isValid = false;
    } else if (isNaN(Number(updateEvent.newCapacity))) {
      errors.newCapacity = 'Capacity must be a valid number';
      isValid = false;
    }
    
    setUpdateValidationErrors(errors);
    return isValid;
  };

const handleAddEvent = async () => {
  if (!validateForm()) return;

  const newEventData = {
    name: newEvent.name,
    description: newEvent.description,
    date: newEvent.date,
    capacity: Number(newEvent.capacity),
  };

  if (isNetworkDown || isServerDown) {
    addPendingOperation({ type: 'ADD', data: newEventData });
    setEvents([...events, { ...newEventData, id: `temp-${new Date().toISOString()}` }]); // Use a deterministic ID
    setNewEvent({ name: '', description: '', date: '', capacity: '' });
    setShowAddForm(false);
    setShowEventsList(true);
    return;
  }

  try {
    const response = await fetch('https://mpp-backend-t8mc.onrender.com/api/events/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${localStorage.getItem('authToken')}`, // Include the token
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEventData),
    });

    if (!response.ok) {
      throw new Error('Failed to add event');
    }

    const data = await response.json();
    setEvents([...events, data]);
    setNewEvent({ name: '', description: '', date: '', capacity: '' });
    setShowAddForm(false);
    setShowEventsList(true);
  } catch (error) {
    console.error('Error adding event:', error);
  }
};
  
const handleEditEvent = (event) => {
  setUpdateEvent({
    currentName: event.name,
    currentDate: event.date,
    newName: event.name,
    newDescription: event.description,
    newDate: event.date,
    newCapacity: event.capacity.toString(),
  });
  setUpdateValidationErrors({
    currentName: '',
    currentDate: '',
    newName: '',
    newDescription: '',
    newDate: '',
    newCapacity: '',
  });
  setUpdateError('');
  setUpdateSuccess('');
  setShowUpdateForm(true); // Open the update modal
  setShowEventsList(false); // Close the events list
};

  const handleUpdateEvent = async () => {
    if (!validateUpdateForm()) return;
  
    const eventToUpdate = events.find(
      event =>
        event.name === updateEvent.currentName &&
        event.date === updateEvent.currentDate
    );
  
    if (!eventToUpdate) {
      setUpdateError('No event found with this name and date');
      return;
    }
  
    const updatedEventData = {
      name: updateEvent.newName,
      description: updateEvent.newDescription,
      date: updateEvent.newDate,
      capacity: Number(updateEvent.newCapacity),
    };
  
    if (isNetworkDown || isServerDown) {
      // Add to pending operations
      addPendingOperation({ type: 'UPDATE', id: eventToUpdate.id, data: updatedEventData });
      const updatedEvents = events.map(event =>
        event.id === eventToUpdate.id ? { ...event, ...updatedEventData } : event
      );
      setEvents(updatedEvents);
      setUpdateSuccess('Event updated locally');
      setTimeout(() => {
        setUpdateEvent({
          currentName: '',
          currentDate: '',
          newName: '',
          newDescription: '',
          newDate: '',
          newCapacity: '',
        });
        setUpdateSuccess('');
        setShowUpdateForm(false);
        setShowEventsList(true);
      }, 1500);
      return;
    }
  
    try {
      const response = await fetch(`https://mpp-backend-t8mc.onrender.com/api/events/${eventToUpdate.id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`, // Include the token
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEventData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
  
      const updatedEvent = await response.json();
      const updatedEvents = events.map(event =>
        event.id === eventToUpdate.id ? updatedEvent : event
      );
      setEvents(updatedEvents);
      setUpdateSuccess('Event updated successfully');
      setTimeout(() => {
        setUpdateEvent({
          currentName: '',
          currentDate: '',
          newName: '',
          newDescription: '',
          newDate: '',
          newCapacity: '',
        });
        setUpdateSuccess('');
        setShowUpdateForm(false);
        setShowEventsList(true);
      }, 1500);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };
  

  const handleDeleteEvent = async () => {
    if (!deleteEvent.name.trim() || !deleteEvent.date) {
      setDeleteError('Both name and date are required');
      return;
    }
  
    const eventToDelete = events.find(
      event =>
        event.name === deleteEvent.name &&
        event.date === deleteEvent.date
    );
  
    if (!eventToDelete) {
      setDeleteError('No event found with this name and date');
      return;
    }
  
    if (isNetworkDown || isServerDown) {
      // Add to pending operations
      addPendingOperation({ type: 'DELETE', id: eventToDelete.id });
      const updatedEvents = events.filter(event => event.id !== eventToDelete.id);
      setEvents(updatedEvents);
      setDeleteSuccess('Event deleted locally');
      setTimeout(() => {
        setDeleteEvent({ name: '', date: '' });
        setDeleteSuccess('');
        setShowDeleteForm(false);
      }, 1500);
      return;
    }
  
    try {
      const response = await fetch(`https://mpp-backend-t8mc.onrender.com/api/events/${eventToDelete.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`, // Include the token
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
  
      const updatedEvents = events.filter(event => event.id !== eventToDelete.id);
      setEvents(updatedEvents);
      setDeleteSuccess('Event deleted successfully');
      setTimeout(() => {
        setDeleteEvent({ name: '', date: '' });
        setDeleteSuccess('');
        setShowDeleteForm(false);
      }, 1500);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };
  

  const handleCloseForm = () => {
    setShowAddForm(false);
    setValidationErrors({
      name: '',
      description: '',
      date: '',
      capacity: ''
    });
  };

  const handleCloseUpdateForm = () => {
    setShowUpdateForm(false);
    setUpdateValidationErrors({
      currentName: '',
      currentDate: '',
      newName: '',
      newDescription: '',
      newDate: '',
      newCapacity: ''
    });
    setUpdateError('');
    setUpdateSuccess('');
  };

  const handleCloseDeleteForm = () => {
    setShowDeleteForm(false);
    setDeleteError('');
    setDeleteSuccess('');
  };

  const handleCloseList = () => {
    setShowEventsList(false);
  };

  const handleDeleteEventX = async (eventId) => {
    if (isNetworkDown || isServerDown) {
      // Add to pending operations
      addPendingOperation({ type: 'DELETE', id: eventId });
      setEvents((prevEvents) => prevEvents.filter(event => event.id !== eventId));
      return;
    }
  
    try {
      const response = await fetch(`https://mpp-backend-t8mc.onrender.com/api/events/${eventId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`, // Include the token
          'Content-Type': 'application/json',
      },
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
  
      setEvents((prevEvents) => prevEvents.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.loginContainer}>
  <h2>Register New User</h2>
  <div className={styles.formGroup}>
    <label>Email:</label>
    <input
      type="email"
      name="email"
      value={registerForm.email}
      onChange={handleRegisterInputChange}
      className={styles.formInput}
    />
  </div>
  <div className={styles.formGroup}>
    <label>Name:</label>
    <input
      type="text"
      name="name"
      value={registerForm.name}
      onChange={handleRegisterInputChange}
      className={styles.formInput}
    />
  </div>
  <div className={styles.formGroup}>
    <label>Password:</label>
    <input
      type="password"
      name="password"
      value={registerForm.password}
      onChange={handleRegisterInputChange}
      className={styles.formInput}
    />
  </div>
  {registerError && <div className={styles.errorMessage}>{registerError}</div>}
  <button onClick={handleRegister} className={styles.loginButton}>Register</button>
  {registerToken && (
    <div className={styles.successMessage}>
      Registration successful! Your token: <code>{registerToken}</code>
    </div>
  )}
</div>
      <div className={styles.loginContainer}>
        <h2>Enter Authorization Token</h2>
        <div className={styles.formGroup}>
          <label>Auth Token:</label>
          <input
            type="text"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            className={styles.formInput}
          />
        </div>
        {loginError && <div className={styles.errorMessage}>{loginError}</div>}
        <button onClick={handleTokenLogin} className={styles.loginButton}>Save Token</button>
      </div>
      <div>
        {typeof window !== 'undefined' && isNetworkDown && (
          <div className="alert alert-warning">You are offline. Changes will be saved locally.</div>
        )}
        {typeof window !== 'undefined' && isServerDown && !isNetworkDown && (
          <div className="alert alert-danger">The server is down. Changes will be saved locally.</div>
        )}
      </div>
      <div className={styles.backgroundContainer}>
        <h1 className={styles.title}>Eventful Library <span className={styles.bookEmoji}>📖</span></h1>
        <img src="https://i.imgur.com/yVXuAqb.png" alt="Background" className={styles.backgroundImage}/>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchButton}>Show All</button>
          <button onClick={() => setShowInfiniteScrollModal(true)} className={styles.searchButton}>Infinite Scroll</button>
          
          <div className={styles.actionButtons}>
            <button onClick={handleAdd} className={styles.actionButton}>Add</button>
            <button onClick={handleUpdate} className={styles.actionButton}>Update</button>
            <button onClick={handleDelete} className={styles.actionButton}>Delete</button>
            <button onClick={handleShowDashboard} className={styles.actionButton}>Dashboard</button>
            <Link href="/videos">
              <button className={styles.actionButton}>Relevant Files</button>
            </Link>
          </div>
        </div>

        {showInfiniteScrollModal && (
          <div className={styles.modal}>
            <div className={`${styles.modalContent} ${styles.scrollableContent}`}>
              <h2>All Events (Infinite Scroll)</h2>

              {visibleEvents.length === 0 ? (
                <p className={styles.noEvents}>No events found.</p>
              ) : (
                <div className={styles.eventsList}>
                  {visibleEvents.map((event) => (
                    <div key={event.id} className={styles.eventCard}>
                      <h3>{event.name}</h3>
                      <p><strong>Description:</strong> {event.description}</p>
                      <p><strong>Date:</strong> {event.date}</p>
                      <p><strong>Capacity:</strong> {event.capacity}</p>
                    </div>
                  ))}
                </div>
              )}

              {isLoadingMore && hasMore && <p>Loading more events...</p>}
              {!hasMore && <p>No more events to load.</p>}

              <div className={styles.modalActions}>
                <button onClick={() => setShowInfiniteScrollModal(false)} className={styles.cancelButton}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showAddForm && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Add New Event</h2>
              <div className={styles.formGroup}>
                <label>Event Name:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={newEvent.name} 
                  onChange={handleInputChange} 
                  className={`${styles.formInput} ${validationErrors.name ? styles.inputError : ''}`}
                />
                {validationErrors.name && (
                  <div className={styles.errorMessage}>{validationErrors.name}</div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Description:</label>
                <textarea 
                  name="description" 
                  value={newEvent.description} 
                  onChange={handleInputChange} 
                  className={`${styles.formInput} ${validationErrors.description ? styles.inputError : ''}`}
                />
                {validationErrors.description && (
                  <div className={styles.errorMessage}>{validationErrors.description}</div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Date:</label>
                <input 
                  type="date" 
                  name="date" 
                  value={newEvent.date} 
                  onChange={handleInputChange} 
                  className={`${styles.formInput} ${validationErrors.date ? styles.inputError : ''}`}
                />
                {validationErrors.date && (
                  <div className={styles.errorMessage}>{validationErrors.date}</div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Capacity:</label>
                <input 
                  type="text" 
                  name="capacity" 
                  value={newEvent.capacity} 
                  onChange={handleInputChange} 
                  className={`${styles.formInput} ${validationErrors.capacity ? styles.inputError : ''}`}
                />
                {validationErrors.capacity && (
                  <div className={styles.errorMessage}>{validationErrors.capacity}</div>
                )}
              </div>
              <div className={styles.modalActions}>
                <button onClick={handleAddEvent} className={styles.addButton}>Add Event</button>
                <button onClick={handleCloseForm} className={styles.cancelButton}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showUpdateForm && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Update Event</h2>
              
              {updateSuccess ? (
                <div className={styles.successMessage}>{updateSuccess}</div>
              ) : (
                <>
                  <p className={styles.updateInstructions}>Enter the details of the event you want to update:</p>
                  
                  <h3>Current Event</h3>
                  <div className={styles.formGroup}>
                    <label>Event Name:</label>
                    <input 
                      type="text" 
                      name="currentName" 
                      value={updateEvent.currentName} 
                      onChange={handleUpdateInputChange} 
                      className={`${styles.formInput} ${updateValidationErrors.currentName ? styles.inputError : ''}`}
                    />
                    {updateValidationErrors.currentName && (
                      <div className={styles.errorMessage}>{updateValidationErrors.currentName}</div>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Date:</label>
                    <input 
                      type="date" 
                      name="currentDate" 
                      value={updateEvent.currentDate} 
                      onChange={handleUpdateInputChange} 
                      className={`${styles.formInput} ${updateValidationErrors.currentDate ? styles.inputError : ''}`}
                    />
                    {updateValidationErrors.currentDate && (
                      <div className={styles.errorMessage}>{updateValidationErrors.currentDate}</div>
                    )}
                  </div>
                  
                  <h3>New Details</h3>
                  <div className={styles.formGroup}>
                    <label>New Event Name:</label>
                    <input 
                      type="text" 
                      name="newName" 
                      value={updateEvent.newName} 
                      onChange={handleUpdateInputChange} 
                      className={`${styles.formInput} ${updateValidationErrors.newName ? styles.inputError : ''}`}
                    />
                    {updateValidationErrors.newName && (
                      <div className={styles.errorMessage}>{updateValidationErrors.newName}</div>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>New Description:</label>
                    <textarea 
                      name="newDescription" 
                      value={updateEvent.newDescription} 
                      onChange={handleUpdateInputChange} 
                      className={`${styles.formInput} ${updateValidationErrors.newDescription ? styles.inputError : ''}`}
                    />
                    {updateValidationErrors.newDescription && (
                      <div className={styles.errorMessage}>{updateValidationErrors.newDescription}</div>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>New Date:</label>
                    <input 
                      type="date" 
                      name="newDate" 
                      value={updateEvent.newDate} 
                      onChange={handleUpdateInputChange} 
                      className={`${styles.formInput} ${updateValidationErrors.newDate ? styles.inputError : ''}`}
                    />
                    {updateValidationErrors.newDate && (
                      <div className={styles.errorMessage}>{updateValidationErrors.newDate}</div>
                    )}
                  </div>
                  <div className={styles.formGroup}>
                    <label>New Capacity:</label>
                    <input 
                      type="text" 
                      name="newCapacity" 
                      value={updateEvent.newCapacity} 
                      onChange={handleUpdateInputChange} 
                      className={`${styles.formInput} ${updateValidationErrors.newCapacity ? styles.inputError : ''}`}
                    />
                    {updateValidationErrors.newCapacity && (
                      <div className={styles.errorMessage}>{updateValidationErrors.newCapacity}</div>
                    )}
                  </div>
                  
                  {updateError && (
                    <div className={styles.errorMessage}>{updateError}</div>
                  )}
                  
                  <div className={styles.modalActions}>
                    <button onClick={handleUpdateEvent} className={styles.updateButton}>Update Event</button>
                    <button onClick={handleCloseUpdateForm} className={styles.cancelButton}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {showDeleteForm && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Delete Event</h2>
              
              {deleteSuccess ? (
                <div className={styles.successMessage}>{deleteSuccess}</div>
              ) : (
                <>
                  <p className={styles.deleteInstructions}>Enter the name and date of the event you want to delete:</p>
                  
                  <div className={styles.formGroup}>
                    <label>Event Name:</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={deleteEvent.name} 
                      onChange={handleDeleteInputChange} 
                      className={`${styles.formInput} ${deleteError ? styles.inputError : ''}`}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Date:</label>
                    <input 
                      type="date" 
                      name="date" 
                      value={deleteEvent.date} 
                      onChange={handleDeleteInputChange} 
                      className={`${styles.formInput} ${deleteError ? styles.inputError : ''}`}
                    />
                  </div>
                  
                  {deleteError && (
                    <div className={styles.errorMessage}>{deleteError}</div>
                  )}
                  
                  <div className={styles.modalActions}>
                    <button onClick={handleDeleteEvent} className={styles.deleteButton}>Delete Event</button>
                    <button onClick={handleCloseDeleteForm} className={styles.cancelButton}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Events List Modal */}
        {showEventsList && (
          <div className={styles.modal}>
            <div className={`${styles.modalContent} ${styles.scrollableContent}`}>
              <h2>All Events</h2>
              {events.length === 0 ? (
                <p className={styles.noEvents}>No events found.</p>
              ) : (
                <div className={styles.eventsList}>
                  {(() => {
                    // Sort events by capacity
                    const sortedEvents = [...events].sort((a, b) =>
                      sortByCapacity ? a.capacity - b.capacity : b.capacity - a.capacity
                    );

                    // Determine highest and lowest capacity for color grading
                    const highestCapacity = Math.max(...events.map(event => event.capacity));
                    const lowestCapacity = Math.min(...events.map(event => event.capacity));

                    // Render sorted events with color grading
                    return sortedEvents.map(event => (
                      <div
                        key={event.id}
                        className={`${styles.eventCard} ${
                          event.capacity === highestCapacity
                            ? styles.highestCapacity
                            : event.capacity === lowestCapacity
                            ? styles.lowestCapacity
                            : ''
                        }`}
                      >
                        <div className={styles.eventHeader}>
                          <h3>{event.name}</h3>
                           <button
                              className={styles.editButton}
                              onClick={() => handleEditEvent(event)}
                            >
                              ✏️
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteEventX(event.id)}
                          >
                            ❌
                          </button>
                        </div>
                        <p><strong>Description:</strong> {event.description}</p>
                        <p><strong>Date:</strong> {event.date}</p>
                        <p><strong>Capacity:</strong>{' '}
                          <span
                            style={{
                              color:
                                event.capacity === highestCapacity
                                  ? '#00AA00'
                                  : event.capacity === lowestCapacity
                                  ? '#AA0000'
                                  : 'inherit',
                            }}
                          >
                            {event.capacity}
                          </span>
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              )}
              {isLoadingMore && <p>Loading more events...</p>}
              {!hasMore && <p>No more events to load.</p>}
              <div className={styles.modalActions}>
                <button
                  onClick={() => setSortByCapacity(!sortByCapacity)}
                  className={styles.sortButton}
                >
                  Sort by Capacity {sortByCapacity ? '⬆️' : '⬇️'}
                </button>
                <button onClick={handleCloseList} className={styles.cancelButton}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      {showDashboard && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.dashboardModal}`}>
            <h2>Dashboard</h2>
            
            <div className={styles.chartsContainer}>
              <div className={styles.chartBox}>
                <h3>Event Capacity</h3>
                <Bar options={options} data={chartData.capacityData} />
              </div>
              
              <div className={styles.chartBox}>
                <h3>Events by Month</h3>
                <Line options={options} data={chartData.monthlyData} />
              </div>
              
              <div className={styles.chartBox}>
                <h3>Capacity Utilization</h3>
                <Pie data={chartData.utilizationData} />
              </div>
            </div>
            
            <h3>Events List</h3>
            <div className={styles.paginatedList}>
              {currentEvents.length === 0 ? (
                <p className={styles.noEvents}>No events found.</p>
              ) : (
                <div className={styles.eventsList}>
                  {(() => {

                    const highestCapacity = Math.max(...events.map(event => event.capacity));
                    const lowestCapacity = Math.min(...events.map(event => event.capacity));
                    
                    return currentEvents.map(event => (
                      <div 
                        key={event.id} 
                        className={`${styles.eventCard} ${
                          event.capacity === highestCapacity ? styles.highestCapacity : 
                          event.capacity === lowestCapacity ? styles.lowestCapacity : ''
                        }`}
                      >
                        <div className={styles.eventHeader}>
                        <h3>{event.name}</h3>
                        <button 
                          className={styles.deleteButton} 
                          onClick={() => handleDeleteEventX(event.id)}
                        >
                          ❌
                        </button>
                      </div>
                        <p><strong>Description:</strong> {event.description}</p>
                        <p><strong>Date:</strong> {event.date}</p>
                        <p><strong>Capacity:</strong> 
                          <span style={{ 
                            color: event.capacity === highestCapacity ? '#00AA00' : 
                                  event.capacity === lowestCapacity ? '#AA0000' : 'inherit' 
                          }}>
                            {event.capacity}
                          </span>
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              )}
              
              <div className={styles.pagination}>
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className={styles.pageButton}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`${styles.pageButton} ${currentPage === i + 1 ? styles.activePage : ''}`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className={styles.pageButton}
                >
                  Next
                </button>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button onClick={() => setShowDashboard(false)} className={styles.cancelButton}>Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}