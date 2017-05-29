package org.wso2.carbon.apimgt.usage.publisher;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.synapse.MessageContext;
import org.apache.synapse.SynapseConstants;
import org.apache.synapse.commons.json.JsonUtil;
import org.apache.synapse.core.axis2.Axis2MessageContext;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.wso2.carbon.apimgt.gateway.APIMgtGatewayConstants;
import org.wso2.carbon.apimgt.usage.publisher.dto.FaultPublisherDTO;
import org.wso2.carbon.utils.multitenancy.MultitenantUtils;

import java.net.URL;

public class APIMgtFaultHandler extends APIMgtCommonExecutionPublisher {

    public static final Log httpLogger = LogFactory.getLog("http.logger");

    public APIMgtFaultHandler() {
        super();
    }

    public boolean mediate(MessageContext messageContext) {
        super.mediate(messageContext);
        if (publisher == null) {
            this.initializeDataPublisher();
        }
        try {
            if (!enabled || skipEventReceiverConnection) {
                return true;
            }
            long requestTime = Long.parseLong((String) messageContext.getProperty(APIMgtGatewayConstants.
                                                                         REQUEST_START_TIME));

            FaultPublisherDTO faultPublisherDTO = new FaultPublisherDTO();
            faultPublisherDTO.setConsumerKey((String) messageContext.getProperty(
                    APIMgtGatewayConstants.CONSUMER_KEY));
            faultPublisherDTO.setContext((String) messageContext.getProperty(
                    APIMgtGatewayConstants.CONTEXT));
            faultPublisherDTO.setApiVersion((String) messageContext.getProperty(
                    APIMgtGatewayConstants.API_VERSION));
            faultPublisherDTO.setApi((String) messageContext.getProperty(
                    APIMgtGatewayConstants.API));
            faultPublisherDTO.setResourcePath((String) messageContext.getProperty(
                    APIMgtGatewayConstants.RESOURCE));
            faultPublisherDTO.setMethod((String) messageContext.getProperty(
                    APIMgtGatewayConstants.HTTP_METHOD));
            faultPublisherDTO.setVersion((String) messageContext.getProperty(
                    APIMgtGatewayConstants.VERSION));
            faultPublisherDTO.setErrorCode(String.valueOf(messageContext.getProperty(
                    SynapseConstants.ERROR_CODE)));
            faultPublisherDTO.setErrorMessage((String) messageContext.getProperty(
                    SynapseConstants.ERROR_MESSAGE));
            faultPublisherDTO.setRequestTime(requestTime);
            faultPublisherDTO.setUsername((String) messageContext.getProperty(
                    APIMgtGatewayConstants.USER_ID));
            faultPublisherDTO.setTenantDomain(MultitenantUtils.getTenantDomain(
                    faultPublisherDTO.getUsername()));
            faultPublisherDTO.setHostName((String) messageContext.getProperty(
                    APIMgtGatewayConstants.HOST_NAME));
            faultPublisherDTO.setApiPublisher((String) messageContext.getProperty(
                    APIMgtGatewayConstants.API_PUBLISHER));
            faultPublisherDTO.setApplicationName((String) messageContext.getProperty(
                    APIMgtGatewayConstants.APPLICATION_NAME));
            faultPublisherDTO.setApplicationId((String) messageContext.getProperty(
                    APIMgtGatewayConstants.APPLICATION_ID));
            String protocol = (String) messageContext.getProperty(
                    SynapseConstants.TRANSPORT_IN_NAME);
            faultPublisherDTO.setProtocol(protocol);

            //find time KPIs
            long responseTime = 0;
            long serviceTime = 0;
            long backendTime = 0;
            long endTime = System.currentTimeMillis();
            boolean cacheHit = false;

            Object beStartTimeProperty = messageContext.getProperty(APIMgtGatewayConstants.BACKEND_REQUEST_START_TIME);
            long backendStartTime = (beStartTimeProperty == null ? 0 : Long.parseLong((String) beStartTimeProperty));
            long backendEndTime = System.currentTimeMillis();

            if (requestTime == 0) {
                responseTime = 0;
                backendTime = 0;
                serviceTime = 0;
            } else if (endTime != 0 && backendStartTime != 0 && backendEndTime != 0) { //When
                // response caching is disabled
                responseTime = endTime - requestTime;
                backendTime = backendEndTime - backendStartTime;
                serviceTime = responseTime - backendTime;

            } else if (endTime != 0 && backendStartTime == 0) {//When response caching enabled
                responseTime = endTime - requestTime;
                serviceTime = responseTime;
                backendTime = 0;
                cacheHit = true;
            }

            org.apache.axis2.context.MessageContext axis2MC = ((Axis2MessageContext) messageContext).
                    getAxis2MessageContext();
            StringBuilder jsonPayloadToString = JsonUtil.toJsonString(axis2MC.getEnvelope().getBody());
            JSONParser parser = new JSONParser();
            JSONObject jsonObject = (JSONObject) parser.parse(jsonPayloadToString.toString());
            String faultMessage = ((JSONObject) ((JSONObject) jsonObject.get("Body")).get("fault")).get("message")
                    .toString();
            String faultDescription = ((JSONObject) ((JSONObject) jsonObject.get("Body")).get("fault"))
                    .get("description").toString();

            httpLogger.info("|"+ requestTime + "|" + backendStartTime + "|" + responseTime + "|" + backendTime + "|"
                    + serviceTime + "|" + messageContext.getProperty("SYNAPSE_REST_API") + "|" + messageContext
                    .getProperty("REST_FULL_REQUEST_PATH") + "|" + messageContext.getProperty("api.ut.HTTP_METHOD")
                    + "|" + messageContext.getProperty("ENDPOINT_ADDRESS") + "|" + cacheHit + "|" + axis2MC
                    .getProperty(SynapseConstants.HTTP_SC) + "|" + "FaultHandler" + "|" +
                    faultMessage + "|" + faultDescription);

            // startTimeStamp|backendStartTimeStamp|elapsed|backendElapsed|serviceTime|API|APIRequestPath|httpMethod|backendUrl|cacheHit|responseCode|handler|faultMessage|faultDescription

            publisher.publishEvent(faultPublisherDTO);

        } catch (Exception e) {
            log.error("Cannot publish event. " + e.getMessage(), e);
        }
        return true; // Should never stop the message flow
    }

    public boolean isContentAware() {
        return false;
    }
}
