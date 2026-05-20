import {
  RATING_CREATE_REQUEST,
  RATING_CREATE_SUCCESS,
  RATING_CREATE_FAIL,
  RATING_CREATE_RESET,
  RATING_LIST_REQUEST,
  RATING_LIST_SUCCESS,
  RATING_LIST_FAIL,
} from '../constants/ratingConstants';

export const ratingCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case RATING_CREATE_REQUEST:
      return { loading: true };
    case RATING_CREATE_SUCCESS:
      return { loading: false, success: true, rating: action.payload };
    case RATING_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case RATING_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

export const ratingListReducer = (state = { ratings: [], avgRating: null }, action) => {
  switch (action.type) {
    case RATING_LIST_REQUEST:
      return { loading: true, ratings: state.ratings || [], avgRating: state.avgRating ?? null };
    case RATING_LIST_SUCCESS:
      return {
        loading: false,
        ratings: action.payload?.ratings || [],
        avgRating: action.payload?.avgRating ?? null,
      };
    case RATING_LIST_FAIL:
      return { loading: false, error: action.payload, ratings: [], avgRating: null };
    default:
      return state;
  }
};
