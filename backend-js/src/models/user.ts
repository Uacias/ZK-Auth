import Joi from 'joi';

export interface User {
  id: string;
  name: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  password: string;
}

export interface LoginPayload {
  name: string;
  password: string;
}

export interface LoginResponse {
  id: string;
  name: string;
}

export const registerSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.min': 'Name must be at least 3 characters long',
    'any.required': 'Name is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  })
});

export const loginSchema = Joi.object({
  name: Joi.string().min(3).required().messages({
    'string.min': 'Name must be at least 3 characters long',
    'any.required': 'Name is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  })
});