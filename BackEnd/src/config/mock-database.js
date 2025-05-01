// Mock database for development and testing 
const mockUsers = [ 
  { 
    user_id: 1, 
    first_name: 'Test', 
    last_name: 'User', 
    email: 'test@example.com', 
    password: '$2a$10$5RzcEl4C2D4yUzqE9SrPAOBQaTxJBhljSNd5LOgJ8ORnUZG3KM4TO', // password123 
    role: 'Intern' 
  }, 
  { 
    user_id: 2, 
    first_name: 'Employer', 
    last_name: 'Test', 
    email: 'employer@example.com', 
    password: '$2a$10$5RzcEl4C2D4yUzqE9SrPAOBQaTxJBhljSNd5LOgJ8ORnUZG3KM4TO', // password123 
    role: 'Employer' 
  } 
]; 
 
const mockCompanies = [ 
  { 
    company_id: 1, 
    company_name: 'Test Company', 
    industry_sector: 'Technology', 
    company_description: 'A test company' 
  } 
]; 
 
const mockEmployers = [ 
  { 
    id: 1, 
    user_id: 2, 
    company_id: 1 
  } 
]; 
 
const mockInterns = [ 
  { 
    id: 1, 
    user_id: 1, 
    student_id: 'ST12345', 
    course: 'Computer Science', 
    skills: '[]', 
    verification_status: 'Accepted' 
  } 
]; 
 
// Mock database operation functions 
const query = async (sql, params) =
  console.log('Mock DB Query:', sql); 
  console.log('Params:', params); 
 
  // Match login query 
  if (sql.includes('SELECT * FROM users_tbl WHERE LOWER(email) = LOWER(?)')) { 
    const email = params[0].toLowerCase(); 
    const user = mockUsers.find(u = === email); 
    return [user ? [user] : []]; 
  } 
 
  // Get employer company 
  if (sql.includes('SELECT company_id FROM employers_tbl WHERE user_id = ?')) { 
    const userId = params[0]; 
    const employer = mockEmployers.find(e = === userId); 
    return [employer ? [employer] : []]; 
  } 
 
  // Default case - return empty array 
  return [[]]; 
}; 
 
// Transaction methods (do nothing in mock) 
const beginTransaction = async () =
  console.log('Mock DB: Begin Transaction'); 
  return null; 
}; 
 
const commit = async () =
  console.log('Mock DB: Commit'); 
}; 
 
const rollback = async () =
  console.log('Mock DB: Rollback'); 
}; 
 
module.exports = { 
  query, 
  beginTransaction, 
  commit, 
  rollback 
}; 
