import * as searchService from '../services/searchService.js';

export const searchUsers = async (req, res) => {
  try {
    const result = await searchService.searchUsers(req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('searchUsers error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

export const searchGigs = async (req, res) => {
  try {
    const result = await searchService.searchGigs(req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('searchGigs error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    const suggestions = await searchService.getSearchSuggestions(q);
    res.status(200).json(suggestions);
  } catch (error) {
    console.error('getSearchSuggestions error:', error);
    res.status(500).json({ message: 'Failed to get suggestions', error: error.message });
  }
};
