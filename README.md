# Gemini Clone

A full-stack web application designed to replicate the core interface and functionality of Google's Gemini, featuring a React frontend and a Spring Boot backend with MySQL and JWT authentication.

## Project Structure

The repository is structured into two main components:

- `frontend/`: Contains the React/Vite web application.
- `backend/`: Contains the Spring Boot REST API.

## Tech Stack

### Frontend
* **Framework:** React + Vite
* **Styling:** Tailwind CSS
* **Animations:** Framer Motion
* **State Management:** React Redux / Context API
* **Icons:** Lucide React

### Backend
* **Framework:** Spring Boot (Java 17)
* **Build Tool:** Maven
* **Database:** MySQL
* **ORM:** Spring Data JPA / Hibernate
* **Security:** Spring Security + JSON Web Tokens (JWT)
* **Utilities:** Lombok

---

## Getting Started

### Prerequisites
Before you begin, ensure you have the following installed:
* **Node.js** (v18+)
* **Java Development Kit (JDK) 17**
* **MySQL Server** (Running locally on port 3306)
* **Maven** (Optional, backend includes a Maven wrapper `mvnw`)

### 1. Database Setup
Create a new MySQL connection running on your `localhost` at port `3306`. 
The backend is configured to automatically create a database named `gemini_clone` if it doesn't exist.
Ensure your credentials match the `backend/src/main/resources/application.properties` file:
```properties
spring.datasource.username=root
spring.datasource.password=Jamshedpur@1
```

### 2. Running the Backend
Navigate to the `backend` directory and start the Spring Boot server:

```bash
cd backend
# If using maven wrapper
./mvnw spring-boot:run
# If using installed maven
mvn spring-boot:run
```
The API will be available at `http://localhost:8080`.

### 3. Running the Frontend
Open a new terminal, navigate to the `frontend` directory, install dependencies, and start the development server:

```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

---

## Features Implemented
- Dynamic, auto-expanding prompt input.
- Chat Session management (Sidebar history).
- AI Model selection dropdown.
- Complete backend setup with Spring Data JPA and Entities (`User`, `ChatSession`, `Message`).
- Secure JWT-based Authentication (Signup & Login).
- Automatic database schema creation via Hibernate.
