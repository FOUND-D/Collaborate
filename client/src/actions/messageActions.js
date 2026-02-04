import api from '../utils/api';

import {
  MESSAGE_SEND_REQUEST,
  MESSAGE_SEND_SUCCESS,
  MESSAGE_SEND_FAIL,

  MESSAGE_LIST_REQUEST,
  MESSAGE_LIST_SUCCESS,
  MESSAGE_LIST_FAIL,

  MESSAGE_MARK_READ_REQUEST,
  MESSAGE_MARK_READ_SUCCESS,
  MESSAGE_MARK_READ_FAIL,

} from '../constants/messageConstants';


/* ===============================
   SEND MESSAGE
=============================== */

export const sendMessage = (messageData) => async (dispatch, getState) => {

  try {

    dispatch({ type: MESSAGE_SEND_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();


    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };


    const { data } = await api.post(
      '/api/messages',
      messageData,
      config
    );


    dispatch({
      type: MESSAGE_SEND_SUCCESS,
      payload: data,
    });

    return data;

  } catch (error) {

    dispatch({
      type: MESSAGE_SEND_FAIL,
      payload:
        error.response?.data?.message ||
        error.message,
    });
  }
};



/* ===============================
   LIST MESSAGES (SILENT MODE)
=============================== */

export const listMessages =

  (type, id, silent = false) =>

  async (dispatch, getState) => {

    try {

      /* Only show loader on first load */

      if (!silent) {

        dispatch({ type: MESSAGE_LIST_REQUEST });

      }



      const {

        userLogin: { userInfo },

      } = getState();



      const config = {

        headers: {

          Authorization: `Bearer ${userInfo.token}`,

        },

      };



            const { data } = await api.get(



              `/api/messages/${type}/${id}`,



              config



            );



      



            // Ensure data is an array before dispatching



            const messagesPayload = Array.isArray(data) ? data : (data ? [data] : []);



      



            dispatch({



              type: MESSAGE_LIST_SUCCESS,



              payload: messagesPayload,



            });



    } catch (error) {

      if (!silent) {

        dispatch({

          type: MESSAGE_LIST_FAIL,

          payload:

            error.response?.data?.message ||

            error.message,

        });

      }

    }

  };



/* ===============================
   MARK AS READ
=============================== */

export const markMessagesAsRead =
  (messageIds) =>
  async (dispatch, getState) => {

    try {

      dispatch({ type: MESSAGE_MARK_READ_REQUEST });


      const {
        userLogin: { userInfo },
      } = getState();


      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };


      await api.put(
        '/api/messages/read',
        { messageIds },
        config
      );


      dispatch({
        type: MESSAGE_MARK_READ_SUCCESS,
      });

    } catch (error) {

      dispatch({
        type: MESSAGE_MARK_READ_FAIL,
        payload:
          error.response?.data?.message ||
          error.message,
      });
    }
  };
