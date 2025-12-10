# Testing Suite Documentation

## Overview
This project includes a comprehensive testing suite covering unit tests, integration tests, and end-to-end tests to ensure code quality and prevent regressions.

## Test Structure

### Unit Tests (`__tests__/`)
- **Component Tests**: Test individual React components for proper rendering and behavior
- **API Tests**: Test API endpoints, validation, and error handling
- **Utility Tests**: Test helper functions and business logic

### End-to-End Tests (`e2e/`)
- **User Journey Tests**: Test complete user workflows from start to finish
- **Cross-browser Tests**: Ensure compatibility across different browsers
- **Responsive Tests**: Verify mobile and desktop experiences
- **Accessibility Tests**: Check for proper ARIA labels and keyboard navigation

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run tests for CI (no watch, with coverage)
npm run test:ci
```

### End-to-End Tests
```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with browser UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

## Test Coverage Goals
- **Components**: 80%+ coverage
- **API Routes**: 90%+ coverage
- **Utilities**: 95%+ coverage
- **E2E**: Critical user journeys covered

## Key Test Categories

### Component Tests
- Error boundary behavior
- Loading states and skeleton UI
- User interactions and state changes
- Accessibility compliance
- Responsive design

### API Tests
- Input validation and sanitization
- Error handling and edge cases
- Authentication and authorization
- Rate limiting and security

### E2E Tests
- Homepage loading and navigation
- Search functionality
- Article reading flow
- Mobile responsiveness
- Performance benchmarks

## Mocking Strategy

### External Dependencies
- **Directus API**: Mocked with Jest to avoid external dependencies
- **Next.js Router**: Mocked for component testing
- **Browser APIs**: Polyfilled for Node.js environment

### Test Data
- **Fixtures**: Consistent test data for predictable results
- **Factories**: Helper functions to generate test data
- **Snapshots**: UI snapshots for regression testing

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Code pushes to main branch
- Manual triggers

### CI Pipeline
1. **Linting**: ESLint checks
2. **Unit Tests**: Jest with coverage
3. **Build Check**: Next.js build verification
4. **E2E Tests**: Playwright on multiple browsers
5. **Performance**: Lighthouse scores validation

## Performance Testing

### Lighthouse Integration
- Automated performance audits
- Accessibility checks
- SEO validation
- Best practices compliance

### Custom Performance Tests
- Component render time benchmarks
- API response time validation
- Bundle size monitoring

## Database Testing

### Query Optimization
- Index recommendation analysis
- Slow query detection
- Connection pooling validation

### Data Integrity
- Foreign key constraint validation
- Orphaned record cleanup
- Data consistency checks

## Test Maintenance

### Best Practices
- **Descriptive test names**: Clear what each test validates
- **Arrange-Act-Assert**: Consistent test structure
- **Independent tests**: No test dependencies
- **Fast execution**: Optimized for quick feedback

### Updating Tests
- Update snapshots after intentional UI changes
- Review and update mocks when dependencies change
- Maintain test data when schema changes

## Debugging Tests

### Common Issues
- **Async operations**: Ensure proper await usage
- **Mock inconsistencies**: Verify mock implementations
- **Environment differences**: Test in same environment as CI

### Debug Tools
- **Jest debug mode**: `npm test -- --verbose`
- **Playwright inspector**: `npm run test:e2e:debug`
- **Coverage reports**: Analyze uncovered code paths

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure 80%+ coverage for new code
3. Add E2E tests for user-facing features
4. Update documentation for test setup

When fixing bugs:
1. Write a test that reproduces the bug
2. Fix the implementation
3. Verify the test passes
4. Ensure no regressions in other tests
