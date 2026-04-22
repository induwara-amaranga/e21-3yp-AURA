package com.aura.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ImageServiceImpl implements ImageService {

    private final Cloudinary cloudinary;

    @Override
    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "aura/uploads",
                            "resource_type", "image"
                    )
            );

            Object secureUrl = uploadResult.get("secure_url");
            if (Objects.isNull(secureUrl)) {
                throw new RuntimeException("Cloudinary did not return secure_url");
            }

            return secureUrl.toString();

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image", e);
        }
    }
}