import React from 'react';

// --- STYLES ---
// Instead of CSS files, we define styles as JavaScript objects.
const styles = {
  appContainer: {
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#2c3e50',
    padding: '20px',
    color: 'white',
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.8em',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    padding: '40px 20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  dataCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardTitle: {
    margin: '0 0 10px 0',
    fontSize: '1em',
    color: '#555',
  },
  cardValue: {
    margin: 0,
    fontSize: '2.5em',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chartPlaceholder: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
    margin: '0 20px 40px 20px',
    backgroundColor: '#f8f9fa',
    border: '2px dashed #dee2e6',
    borderRadius: '5px',
    color: '#6c757d',
  }
};

// --- COMPONENT ---
function App() {
  // In a real app, this data would come from an API
  const civicData = {
    voterTurnout: 67,
    communityVolunteeringHours: 1250,
    publicMeetingAttendance: 89,
  };

  return (
    <div style={styles.appContainer}>
      {/* Header Section */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Civic Engagement Dashboard</h1>
      </header>
      
      <main>
        {/* Data Cards Grid */}
        <div style={styles.dashboardGrid}>
          
          {/* Card 1 */}
          <div style={styles.dataCard}>
            <h3 style={styles.cardTitle}>Voter Turnout</h3>
            <p style={styles.cardValue}>{civicData.voterTurnout}%</p>
          </div>
          
          {/* Card 2 */}
          <div style={styles.dataCard}>
            <h3 style={styles.cardTitle}>Volunteer Hours (YTD)</h3>
            <p style={styles.cardValue}>{civicData.communityVolunteeringHours.toLocaleString()}</p>
          </div>
          
          {/* Card 3 */}
          <div style={styles.dataCard}>
            <h3 style={styles.cardTitle}>Public Meeting Attendance</h3>
            <p style={styles.cardValue}>{civicData.publicMeetingAttendance}</p>
          </div>

        </div>

        {/* Chart Placeholder Section */}
        <div style={styles.chartPlaceholder}>
          <p>Chart would be displayed here.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
