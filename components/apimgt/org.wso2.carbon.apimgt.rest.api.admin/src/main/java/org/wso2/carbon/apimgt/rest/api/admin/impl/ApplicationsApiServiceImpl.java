package org.wso2.carbon.apimgt.rest.api.admin.impl;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.wso2.carbon.apimgt.api.APIAdmin;
import org.wso2.carbon.apimgt.api.APIConsumer;
import org.wso2.carbon.apimgt.api.APIManagementException;
import org.wso2.carbon.apimgt.api.model.Application;
import org.wso2.carbon.apimgt.impl.APIAdminImpl;
import org.wso2.carbon.apimgt.impl.APIManagerFactory;
import org.wso2.carbon.apimgt.impl.internal.ServiceReferenceHolder;
import org.wso2.carbon.apimgt.impl.utils.APIUtil;
import org.wso2.carbon.apimgt.rest.api.admin.ApplicationsApiService;
import org.wso2.carbon.apimgt.rest.api.admin.dto.ApplicationListDTO;
import org.wso2.carbon.apimgt.rest.api.admin.utils.mappings.ApplicationMappingUtil;
import org.wso2.carbon.apimgt.rest.api.util.RestApiConstants;
import org.wso2.carbon.apimgt.rest.api.util.utils.RestApiUtil;
import org.wso2.carbon.user.api.AuthorizationManager;
import org.wso2.carbon.user.api.UserStoreException;
import org.wso2.carbon.utils.multitenancy.MultitenantConstants;
import org.wso2.carbon.utils.multitenancy.MultitenantUtils;

import javax.ws.rs.core.Response;

public class ApplicationsApiServiceImpl extends ApplicationsApiService {

    private static final Log log = LogFactory.getLog(ApplicationsApiServiceImpl.class);

    @Override
    public Response applicationsApplicationIdChangeOwnerPost(String owner, String applicationId) {

        APIConsumer apiConsumer = null;
        try {
            apiConsumer = APIManagerFactory.getInstance().getAPIConsumer(owner);
            Application application = apiConsumer.getApplicationByUUID(applicationId);
            boolean applicationUpdated = apiConsumer.updateApplicationOwner(owner, application);
            if (applicationUpdated) {
                return Response.ok().build();
            } else {
                RestApiUtil.handleInternalServerError("Error while updating application owner " + applicationId, log);
            }

        } catch (APIManagementException e) {
            RestApiUtil.handleInternalServerError("Error while updating application owner " + applicationId, e, log);
        }

        return null;
    }

    @Override
    public Response applicationsGet(String user, Integer limit, Integer offset, String accept, String ifNoneMatch) {
//    public Response applicationsGet(String user, Integer limit, Integer offset, String accept, String ifNoneMatch,
//      boolean getAllUserApps) {

        boolean getAllUserApps = true;
        boolean migrationEnabled = true; // read from system config
        // if no username provided user associated with access token will be used
        ApplicationListDTO applicationListDTO;

        try {
            if (user == null || user.isEmpty()) {
                user = RestApiUtil.getLoggedInUsername();
            }
            String superAdminRole =
                    ServiceReferenceHolder.getInstance().getRealmService().
                            getTenantUserRealm(MultitenantConstants.SUPER_TENANT_ID).getRealmConfiguration().getAdminRoleName();

            //check whether logged in user is a super tenant user
            String superTenantDomain =
                    ServiceReferenceHolder.getInstance().getRealmService().getTenantManager().getSuperTenantDomain();
            boolean isSuperTenantUser = RestApiUtil.getLoggedInUserTenantDomain().equals(superTenantDomain);

            //check whether the user has super tenant admin role
            boolean isSuperAdminRoleNameExist = APIUtil.isRoleNameExist(user, superAdminRole);

            limit = limit != null ? limit : RestApiConstants.PAGINATION_LIMIT_DEFAULT;
            offset = offset != null ? offset : RestApiConstants.PAGINATION_OFFSET_DEFAULT;
            if (getAllUserApps && migrationEnabled && isSuperAdminRoleNameExist && isSuperTenantUser) {
                APIAdmin apiAdmin = new APIAdminImpl();
                Application[] allMatchedApps = apiAdmin.getAllApplications();
                applicationListDTO = ApplicationMappingUtil.fromApplicationsToDTO(allMatchedApps, allMatchedApps.length, offset);
                ApplicationMappingUtil.setPaginationParams(applicationListDTO, limit, offset,
                        allMatchedApps.length);
                return Response.ok().entity(applicationListDTO).build();
            } else {
                if (!MultitenantUtils.getTenantDomain(user).equals
                        (RestApiUtil.getLoggedInUserTenantDomain())) {
                    String errorMsg = "User " + user + " is not available for the current tenant domain";
                    log.error(errorMsg);
                    return Response.status(Response.Status.FORBIDDEN).entity(errorMsg).build();
                }
                limit = limit != null ? limit : RestApiConstants.PAGINATION_LIMIT_DEFAULT;
                offset = offset != null ? offset : RestApiConstants.PAGINATION_OFFSET_DEFAULT;

                APIConsumer apiConsumer = APIManagerFactory.getInstance().getAPIConsumer(user);
                Application[] allMatchedApps = apiConsumer.getApplicationsByOwner(user);

                //allMatchedApps are already sorted to application name
                applicationListDTO = ApplicationMappingUtil.fromApplicationsToDTO(allMatchedApps, limit, offset);
                ApplicationMappingUtil.setPaginationParams(applicationListDTO, limit, offset,
                        allMatchedApps.length);

                return Response.ok().entity(applicationListDTO).build();
            }
        } catch (APIManagementException e) {
            RestApiUtil.handleInternalServerError("Error while retrieving applications of the user " + user, e, log);
        } catch (UserStoreException e) {
            RestApiUtil.handleInternalServerError("Error while checking required permissions to get all applications " +
                    "across all tenants", e, log);
        }
        return null;
    }
}
