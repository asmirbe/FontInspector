// jest.config.js
export default {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	setupFiles: ['./jest.setup.js'],
	transform: {
		'^.+\\.tsx?$': 'ts-jest'
	}
};